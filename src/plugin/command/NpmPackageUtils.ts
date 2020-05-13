/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable import/prefer-default-export,@typescript-eslint/no-explicit-any,no-await-in-loop */

import _ from 'lodash';
import { promises as fs, constants } from 'fs';
import path from 'path';
import debug from 'debug';
import axios from 'axios';
import { maxSatisfying, coerce } from 'semver';
import tar from 'tar-fs';
import util from 'util';
import gunzip from 'gunzip-maybe';
import { pipeline } from 'stream';

const pipelinePromise = util.promisify(pipeline);

const log: debug.Debugger = debug('NodePackageUtils');

export interface PackageSpec {
    name: string;

    /**
     * If not specified when requesting an install, the `latest` dist-tag will be used.
     */
    version?: string;

    tarballUri?: string;
}

/**
 * This is a VERY simple implementation of NPM based package management functionality specifically for CLI plugins.
 *
 * * Packages to be installed are assumed to be pre-bundled i.e. there is no need to install their
 * declared dependencies. Because of this the following is also the case:
 * ** No support is provided for multiple versions of the same package.
 * ** All packages are installed at the top level or at scoped level i.e. there are no installations below other
 * packages to accommodate multiple versions.
 * * The installed set of packages is assumed to always be in a valid state and to have not been modified manually
 * or by another process!
 * * The only `dist-tag` supported is `latest`.
 * * Package checksums are not verified!
 * * Git URLS are not supported.
 */

async function getPackument(remoteModuleRegistry: string, packageName: string): Promise<any> {
    try {
        const uri = `${remoteModuleRegistry}/${packageName}`;
        log(`Packument URI: ${uri}`);
        const response = await axios.get(uri, {
            headers: {
                Accept: 'application/vnd.npm.install-v1+json'
            }
        });
        log(`Packument: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (err) {
        throw new Error(`Error while attempting to retrieve packument for ${packageName} => ${err}`);
    }
}

async function extract(packageLocation: string, packageSpec: PackageSpec): Promise<void> {
    if (_.isUndefined(packageSpec.tarballUri)) {
        throw new Error(`No tarball URI in package spec for package: ${packageSpec.name}`);
    }
    const packageFolder = path.join(packageLocation, packageSpec.name);
    let exists = false;
    try {
        await fs.access(packageFolder, constants.R_OK);
        exists = true;
    } catch (err) {
        // desired scenario
    }
    if (exists) {
        throw new Error(`Extract target path already exists: ${packageFolder}`);
    }
    try {
        await fs.mkdir(packageFolder, { recursive: true });
        const response = await axios.get(packageSpec.tarballUri, {
            responseType: 'stream'
        });
        const source = response.data;
        const process = gunzip();
        const sink = tar.extract(packageFolder, {
            map: (header) => {
                // eslint-disable-next-line no-param-reassign
                header.name = header.name.replace(/^(package\/)/, '');
                return header;
            }
        });
        await pipelinePromise(
            source,
            process,
            sink
        );
    } catch (err) {
        try {
            await fs.rmdir(packageFolder, { recursive: true });
        } catch (err2) {
            throw new Error(`Ignoring error while removing ${
                packageFolder} as part of failure rollback => ${err} => ${err2}`);
        }
        throw new Error(`Error while attempting to extract tarball for ${packageSpec.name} => ${err}`);
    }
}

async function getPackageFolders(parentFolder: string): Promise<string[]> {

    let folders: string[] = [];

    const contents = await fs.readdir(parentFolder);

    for (const entry of contents) {
        const childPath = path.join(parentFolder, entry);
        try {
            const stats = await fs.stat(childPath);
            if (stats.isDirectory()) {
                // scoped directory
                if (entry.startsWith('@')) {
                    folders = folders.concat(await getPackageFolders(childPath));
                } else {
                    folders.push(childPath);
                }
            }
        } catch (err) {
            log(`Ignoring error while attempting to stat: ${childPath} => ${err}`);
        }
    }
    return folders;
}

async function getInstalledPackageMetadatas(packageLocation: string): Promise<any[]> {
    const folders = await getPackageFolders(packageLocation);
    const packageMetadatas = [];
    for (const folder of folders) {
        const packageJsonPath = path.join(folder, 'package.json');
        try {
            packageMetadatas.push(JSON.parse((await fs.readFile(packageJsonPath)).toString()));
        } catch (err) {
            log(`Ignoring error while attempting to read and parse: ${packageJsonPath} => ${err}`);
        }
    }
    return packageMetadatas;
}

/**
 * Return a list of all packages installed in the specified package location.
 *
 * @param packageLocation the location to discover installed packages.
 * @return a list of [[PackageSpec]] instances.
 */
export async function getInstalledPackages(packageLocation: string): Promise<PackageSpec[]> {

    const packageMetadatas = await getInstalledPackageMetadatas(packageLocation);
    return packageMetadatas.map((packageMetadata: any) => ({
        name: packageMetadata.name,
        version: packageMetadata.version
    }));
}

/**
 * Resolved a fixed package spec for the provided package spec which may have no version or a version range.
 *
 * @param remoteModuleRegistry plugin module remote registry location
 * @param packageSpec the spec of the required package
 * @return a [[PackageSpec]] instance which has a fixed version
 */
export async function resolvePackageSpec(remoteModuleRegistry: string, packageSpec: PackageSpec): Promise<PackageSpec> {
    const packument = await getPackument(remoteModuleRegistry, packageSpec.name);

    // NOTE: only dist-tag supported is latest
    let requiredVersion = packageSpec.version;
    if (_.isUndefined(requiredVersion) || (requiredVersion === 'latest')) {
        if (_.isUndefined(packument['dist-tags']) || (_.isEmpty(packument['dist-tags']))) {
            throw new Error(`No dist-tags when looking for latest version of package: ${packageSpec.name}`);
        }
        if (_.isUndefined(packument['dist-tags'].latest)) {
            throw new Error(`No latest dist-tags when looking for latest version of package: ${packageSpec.name}`);
        }
        requiredVersion = packument['dist-tags'].latest;
    }

    const fixedVersion = coerce(requiredVersion);
    if (_.isNull(fixedVersion)) {
        throw new Error(`Unsupported non-semantic version: ${requiredVersion} for package: ${packageSpec.name}`);
    }
    const installVersion = maxSatisfying(
        Object.keys(packument.versions), fixedVersion.raw, { loose: true }
    );
    if (_.isNull(installVersion)) {
        throw new Error(`Unavailable version: ${fixedVersion.raw} for package: ${packageSpec.name}`);
    }
    return {
        name: packageSpec.name,
        version: installVersion,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        tarballUri: packument.versions[installVersion]!.dist!.tarball
    };
}

/**
 * Install a specified package.
 *
 * @param packageLocation the location to discover installed packages.
 * @param packageSpec the package to install
 */
export async function installPackage(packageLocation: string, packageSpec: PackageSpec): Promise<void> {
    try {
        await extract(packageLocation, packageSpec);
        log(`Installed module ${packageSpec.name}@${packageSpec.version} into ${packageLocation}`);
    } catch (err) {
        throw new Error(`Failed to install module: ${packageSpec} => ${err}`);
    }
}

/**
 * Uninstall a specified package.
 *
 * @param packageLocation the location to discover installed packages.
 * @param packageSpec the package to uninstall
 */
export async function uninstallPackage(packageLocation: string, packageSpec: PackageSpec): Promise<void> {
    if (_.isUndefined(packageSpec.version)) {
        throw new Error(`Version for package ${packageSpec.name} must be specified when uninstalling!`);
    }
    const packageFolder = path.join(packageLocation, packageSpec.name);
    try {
        await fs.access(packageFolder, constants.R_OK);
    } catch (err) {
        log(`Ignoring missing path when uninstalling: ${packageFolder}`);
        return;
    }

    const stats = await fs.stat(packageFolder);
    if (!stats.isDirectory()) {
        throw new Error(`Specified path is a file, not a folder: ${packageFolder}`);
    }

    let packageJson;
    const packageJsonPath = path.join(packageFolder, 'package.json');
    try {
        packageJson = JSON.parse((await fs.readFile(packageJsonPath)).toString());
    } catch (err) {
        throw new Error(`Error while attempting to read and parse: ${packageJsonPath} => ${err}`);
    }

    if (packageJson.version !== packageSpec.version) {
        throw new Error(`Version mismatch when uninstalling package: ${packageSpec.name}@${
            packageSpec.version} != ${packageJson.version}`);
    }
    try {
        await fs.rmdir(packageFolder, { recursive: true });
    } catch (err) {
        throw new Error(`Failed to remove path ${packageFolder} for module: ${packageSpec.name} => ${err}`);
    }
}
