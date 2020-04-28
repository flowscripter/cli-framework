/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable import/prefer-default-export,@typescript-eslint/no-explicit-any */

import _ from 'lodash';
import { promises as fs } from 'fs';
import path from 'path';
import debug from 'debug';
import { extract, packument } from 'pacote';

const log: debug.Debugger = debug('NodePackageUtils');

/**
 * This is a VERY simple implementation of NPM based package management functionality.
 *
 * * No support is provided for multiple versions!
 * * All packages are installed at the top level!
 * * Differing package versions for dependencies are not supported!
 * * Installed packages are assumed to always be in a valid state and to have not been modified manually
 * or by another process!
 * * Versions in specs are expected to be explicit and not use ranges!
 * * Dist-tags are not supported!
 * * Package checksums are not verified!
 */

async function getInstalledPackageMetadata(packageLocation: string): Promise<any[]> {
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
            log(`Ignoring error while attempting to stat: ${packagePath}`);
        }
    }

    const packages = [];
    for (const folder of folders) {
        const packageJsonPath = path.join(packageLocation, folder, 'package.json');
        try {
            // eslint-disable-next-line no-await-in-loop
            packages.push(JSON.parse((await fs.readFile(packageJsonPath)).toString()));
        } catch (err) {
            log(`Ignoring error while attempting to read and parse: ${packageJsonPath}`);
        }
    }
    return packages;
}

/**
 * Return a list of all packages installed in the specified package location.
 *
 * @param packageLocation the location to discover installed packages.
 * @return a list of package specs in the form of `packageName@packageVersion`
 */
export async function getAllInstalledPackages(packageLocation: string): Promise<string[]> {

    const packageMetadatas = await getInstalledPackageMetadata(packageLocation);
    return packageMetadatas.map((packageMetadata: any) => `${packageMetadata.name}@${packageMetadata.version}`);
}

/**
 * Return a list of top level packages installed in the specified package location.
 *
 * @param packageLocation the location to discover installed packages.
 * @return a list of package specs in the form of `packageName@packageVersion`
 */
export async function getInstalledTopLevelPackages(packageLocation: string): Promise<string[]> {

    const packageMetadatas = await getInstalledPackageMetadata(packageLocation);

    const installedPackageSpecs: string[] = packageMetadatas.map((packageMetadata: any) => `${
        packageMetadata.name}@${packageMetadata.version}`);

    const dependencyPackageSpecs: string[] = [];

    packageMetadatas.forEach((packageMetadata) => {
        if (!_.isEmpty(packageMetadata.dependencies)) {
            for (const [name, version] of Object.entries(packageMetadata.dependencies)) {
                dependencyPackageSpecs.push(`${name}@${version}`);
            }
        }
    });
    return installedPackageSpecs.filter((spec) => !dependencyPackageSpecs.includes(spec));
}

/**
 * Return a list of all dependencies for specified packages (including the specified packages).
 *
 * Read the package manifest information from installed packages.
 *
 * @param packageLocation the location to discover installed packages.
 * @param packageSpecs the package specs to determine dependencies from
 * @return a list of package specs in the form of `packageName@packageVersion`
 */
export async function getInstalledDependencies(packageLocation: string, packageSpecs: string[]): Promise<string[]> {
    const packageMetadatas = await getInstalledPackageMetadata(packageLocation);

    const installedDependencyMetadatas: string[] = packageMetadatas.filter(
        (packageMetadata: any) => packageSpecs.includes(`${packageMetadata.name}@${packageMetadata.version}`)
    );

    const dependencyPackageSpecs: string[] = [];

    installedDependencyMetadatas.forEach((packageMetadata: any) => {
        let packageSpec = `${packageMetadata.name}@${packageMetadata.version}`;
        if (!dependencyPackageSpecs.includes(packageSpec)) {
            dependencyPackageSpecs.push(packageSpec);
        }
        if (!_.isEmpty(packageMetadata.dependencies)) {
            for (const [name, version] of Object.entries(packageMetadata.dependencies)) {
                packageSpec = `${name}@${version}`;
                if (!dependencyPackageSpecs.includes(packageSpec)) {
                    dependencyPackageSpecs.push(packageSpec);
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
 * @param localModuleCacheLocation plugin module local cache location
 * @param packageName the name of the required package
 * @param packageVersion optional version of the required package
 * @return an iterator of package specs in the form of `packageName@packageVersion`
 */
export async function getDependencies(remoteModuleRegistry: string, localModuleCacheLocation: string,
    packageName: string, packageVersion?: string): Promise<string[]> {

    let spec = packageName;
    if (!_.isUndefined(packageVersion)) {
        spec = `${spec}@${packageVersion}`;
    }

    const unresolvedSpecs = [spec];

    const resolvedSpecs: string[] = [];

    // continue looping through unresolved specs until we stop adding them
    for (let i = 0; i < unresolvedSpecs.length; i += 1) {

        let currentSpec = unresolvedSpecs[i];

        // eslint-disable-next-line no-await-in-loop
        await packument(currentSpec, {
            registry: remoteModuleRegistry,
            cache: localModuleCacheLocation
        })
            .then((pkmt) => {
                let currentVersion = currentSpec.split('@')[1];
                if (_.isUndefined(currentVersion)) {
                    // eslint-disable-next-line prefer-destructuring
                    currentVersion = Object.keys(pkmt.versions)[0];
                    currentSpec = `${currentSpec}@${currentVersion}`;
                }

                if (!resolvedSpecs.includes(currentSpec)) {
                    resolvedSpecs.push(currentSpec);
                }

                const manifest = pkmt.versions[currentVersion] as any;

                // add any further specs we need to resolve
                if (!_.isEmpty(manifest.dependencies)) {
                    Object.entries(manifest.dependencies).forEach(([dependencyName, dependencyVersion]) => {
                        const dependencySpec = `${dependencyName}@${dependencyVersion}`;
                        if (!unresolvedSpecs.includes(dependencySpec) && !resolvedSpecs.includes(dependencySpec)) {
                            unresolvedSpecs.push(dependencySpec);
                        }
                    });
                }
            });
    }
    return resolvedSpecs;
}

/**
 * Install a specified package.
 *
 * @param packageLocation the location to discover installed packages.
 * @param remoteModuleRegistry plugin module remote registry location
 * @param localModuleCacheLocation plugin module local cache location
 * @param packageSpec the package to install in the form of `packageName@packageVersion`
 */
export async function installPackage(packageLocation: string, remoteModuleRegistry: string,
    localModuleCacheLocation: string, packageSpec: string): Promise<void> {
    try {
        const { from, resolved, integrity } = await extract(packageSpec, packageLocation, {
            registry: remoteModuleRegistry,
            cache: localModuleCacheLocation
        });
        log(`Installed module: ${from} : ${resolved} : ${integrity}`);
    } catch (err) {
        log(`Failed to install module: ${packageSpec}: ${err}`);
        throw new Error(`Failed to install module: ${packageSpec}`);
    }
}

/**
 * Uninstall a specified package.
 *
 * @param packageLocation the location to discover installed packages.
 * @param packageSpec the package to install in the form of `packageName@packageVersion`
 */
export async function uninstallPackage(packageLocation: string, packageSpec: string): Promise<void> {
    const packageName = packageSpec.split('@')[0];
    try {
        await fs.rmdir(path.join(packageLocation, packageName), { recursive: true });
    } catch (err) {
        log(`Failed to uninstall module: ${packageSpec}: ${err}`);
        throw new Error(`Failed to uninstall module: ${packageSpec}`);
    }
}
