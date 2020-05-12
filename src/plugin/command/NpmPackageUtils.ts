/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable import/prefer-default-export,@typescript-eslint/no-explicit-any */

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
     * If not specified when requesting an install, "latest" dist-tag will be used.
     */
    version?: string;

    tarballUri?: string;
}

/**
 * This is a VERY simple implementation of NPM based package management functionality.
 *
 * * No support is provided for multiple versions!
 * * All packages are installed at the top level!
 * * Differing package versions for dependencies are not supported!
 * * Versions in specs are expected to be explicit and not use ranges!
 * * Installed packages are assumed to always be in a valid state and to have not been modified manually
 * or by another process!
 * * Dist-tags are not really supported (apart from looking for latest if no version is specified)!
 * * Package checksums are not verified!
 */

async function getPackument(remoteModuleRegistry: string, packageSpec: PackageSpec): Promise<any> {
    try {
        const uri = `${remoteModuleRegistry}/${packageSpec.name}`;
        log(`Packument URI: ${uri}`);
        const response = await axios.get(uri, {
            headers: {
                Accept: 'application/vnd.npm.install-v1+json'
            }
        });
        log(`Packument: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (err) {
        throw new Error(`Error while attempting to retrieve packument for ${packageSpec.name} => ${err}`);
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
        await fs.mkdir(packageFolder);
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

async function getInstalledPackageMetadatas(packageLocation: string): Promise<any[]> {
    const contents = await fs.readdir(packageLocation);

    const folders: string[] = [];

    for (const entry of contents) {
        const packagePath = path.join(packageLocation, entry);
        try {
            // eslint-disable-next-line no-await-in-loop
            const stats = await fs.stat(path.join(packageLocation, entry));
            if (stats.isDirectory()) {
                folders.push(entry);
            }
        } catch (err) {
            log(`Ignoring error while attempting to stat: ${packagePath} => ${err}`);
        }
    }

    const packageMetadatas = [];
    for (const folder of folders) {
        // NOTE: only one level of dependencies supported
        const packageJsonPath = path.join(packageLocation, folder, 'package.json');
        try {
            // eslint-disable-next-line no-await-in-loop
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
export async function getAllInstalledPackages(packageLocation: string): Promise<PackageSpec[]> {

    const packageMetadatas = await getInstalledPackageMetadatas(packageLocation);
    return packageMetadatas.map((packageMetadata: any) => ({
        name: packageMetadata.name,
        version: packageMetadata.version
    }));
}

/**
 * Return a list of top level packages installed in the specified package location.
 *
 * @param packageLocation the location to discover installed packages.
 * @return a list of [[PackageSpec]] instances.
 */
export async function getInstalledTopLevelPackages(packageLocation: string): Promise<PackageSpec[]> {

    const packageMetadatas = await getInstalledPackageMetadatas(packageLocation);

    const installedPackageSpecs: PackageSpec[] = packageMetadatas.map((packageMetadata: any) => ({
        name: packageMetadata.name,
        version: packageMetadata.version
    }));

    const dependencyPackageSpecs: string[] = [];

    packageMetadatas.forEach((packageMetadata) => {
        if (!_.isEmpty(packageMetadata.dependencies)) {
            for (const [name, version] of Object.entries(packageMetadata.dependencies)) {
                dependencyPackageSpecs.push(`${name}@${version}`);
            }
        }
    });
    // NOTE: no support for version ranges
    return installedPackageSpecs.filter((spec) => !dependencyPackageSpecs.includes(`${spec.name}@${spec.version}`));
}

/**
 * Return a list of all dependencies for specified packages (including the specified packages).
 *
 * Read the package manifest information from installed packages.
 *
 * @param packageLocation the location to discover installed packages.
 * @param packageSpecs the package specs to determine dependencies from
 * @return a list of package specs
 */
export async function getInstalledDependencies(packageLocation: string, packageSpecs: PackageSpec[]):
    Promise<PackageSpec[]> {

    const desiredPackageSpecStrings = packageSpecs.map(
        (packageSpec) => (`${packageSpec.name}@${packageSpec.version}`)
    );

    const installedPackageMetadatas = await getInstalledPackageMetadatas(packageLocation);

    // NOTE: no support for version ranges
    const installedDesiredMetadatas: string[] = installedPackageMetadatas.filter(
        (packageMetadata: any) => desiredPackageSpecStrings.includes(
            `${packageMetadata.name}@${packageMetadata.version}`
        )
    );

    const dependencyPackageSpecs: PackageSpec[] = [];
    const dependencyPackageSpecStrings: string[] = [];

    installedDesiredMetadatas.forEach((packageMetadata: any) => {
        let packageSpecString = `${packageMetadata.name}@${packageMetadata.version}`;
        // NOTE: no support for version ranges
        if (!dependencyPackageSpecStrings.includes(packageSpecString)) {
            dependencyPackageSpecStrings.push(packageSpecString);
            dependencyPackageSpecs.push({
                name: packageMetadata.name,
                version: packageMetadata.version
            });
        }
        // NOTE: only one level of dependencies supported
        if (!_.isEmpty(packageMetadata.dependencies)) {
            for (const [name, version] of Object.entries(packageMetadata.dependencies as [string, string])) {
                packageSpecString = `${name}@${version}`;
                if (!dependencyPackageSpecStrings.includes(packageSpecString)) {
                    dependencyPackageSpecStrings.push(packageSpecString);
                    dependencyPackageSpecs.push({
                        name,
                        version
                    });
                }
            }
        }
    });
    return dependencyPackageSpecs;
}

/**
 * Return a list of all packages required to be installed for the specified package (including the specified package).
 *
 * @param remoteModuleRegistry plugin module remote registry location
 * @param packageSpec the spec of the required package
 * @return an iterator of [[PackageSpec]] instances
 */
export async function getDependencies(remoteModuleRegistry: string, packageSpec: PackageSpec): Promise<PackageSpec[]> {

    // NOTE: only one level of dependencies supported
    // NOTE: no support for version ranges
    const unresolvedSpecStrings: string[] = [];
    const unresolvedSpecs: PackageSpec[] = [];

    const resolvedSpecStrings: string[] = [];
    const resolvedSpecs: PackageSpec[] = [];

    // NOTE: default to latest dist-tag if no version specified
    let specString = packageSpec.name;
    if (!_.isUndefined(packageSpec.version)) {
        specString = `${specString}@${packageSpec.version}`;
        unresolvedSpecs.push(packageSpec);
    } else {
        specString = `${specString}@latest`;
        unresolvedSpecs.push({
            name: packageSpec.name,
            version: 'latest'
        });
    }
    unresolvedSpecStrings.push(specString);
    log(`Pending to resolve: ${specString}`);

    // continue looping through unresolved specs until we stop adding them
    for (let i = 0; i < unresolvedSpecs.length; i += 1) {

        const currentSpecString = unresolvedSpecStrings[i];
        const currentSpec = unresolvedSpecs[i];

        // eslint-disable-next-line no-await-in-loop
        const packument = await getPackument(remoteModuleRegistry, currentSpec);

        if (_.isUndefined(currentSpec.version)) {
            throw new Error(`Version not specified for package: ${currentSpec.name}`);
        }
        // NOTE: only dist-tag supported is latest
        if (currentSpec.version === 'latest') {
            if (_.isUndefined(packument['dist-tags']) || (_.isEmpty(packument['dist-tags']))) {
                throw new Error(`No dist-tags when looking for latest version of package: ${currentSpec.name}`);
            }
            if (_.isUndefined(packument['dist-tags'].latest)) {
                throw new Error(`No latest dist-tags when looking for latest version of package: ${currentSpec.name}`);
            }
            // currentVersion = ;
            currentSpec.version = packument['dist-tags'].latest;
        }

        if (_.isUndefined(currentSpec.version)) {
            throw new Error(`Version not specified for package: ${currentSpec.name}`);
        }
        const requiredVersion = coerce(currentSpec.version);
        if (_.isNull(requiredVersion)) {
            throw new Error(`Version not valid semantic version for package: ${currentSpec.name}`);
        }
        const installVersion = maxSatisfying(
            Object.keys(packument.versions), requiredVersion.raw, { loose: true }
        );
        if (_.isNull(installVersion)) {
            throw new Error(`Version not resolvable for package: ${currentSpec.name}@${currentSpec.version}`);
        }
        currentSpec.version = installVersion;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        currentSpec.tarballUri = packument.versions[currentSpec.version]!.dist!.tarball;

        if (!resolvedSpecStrings.includes(currentSpecString)) {
            resolvedSpecStrings.push(currentSpecString);
            resolvedSpecs.push(currentSpec);
        }

        const manifest = packument.versions[currentSpec.version];

        // add any further specs we need to resolve
        if (!_.isEmpty(manifest.dependencies)) {
            // NOTE: only one level of dependencies supported
            Object.entries(manifest.dependencies).forEach(([name, version]) => {
                const newDependencySpecString = `${name}@${version}`;
                if (!unresolvedSpecStrings.includes(newDependencySpecString)
                    && !resolvedSpecStrings.includes(newDependencySpecString)) {
                    unresolvedSpecStrings.push(newDependencySpecString);
                    log(`Pending to resolve: ${newDependencySpecString}`);
                    unresolvedSpecs.push({
                        name,
                        version: version as string
                    });
                }
            });
        }
    }
    return resolvedSpecs;
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
