/* eslint-disable max-classes-per-file,@typescript-eslint/no-non-null-assertion,no-await-in-loop */

/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import SubCommand from '../../api/SubCommand';
import Positional from '../../api/Positional';
import Option from '../../api/Option';
import Printer, { Icon, STDERR_PRINTER_SERVICE } from '../../core/service/PrinterService';
import PluginRegistry, { PLUGIN_REGISTRY_SERVICE } from '../service/PluginRegistryService';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getDependencies,
    getInstalledDependencies,
    installPackage,
    uninstallPackage
} from './NpmPackageUtils';

abstract class AbstractPluginCommand {

    protected printer: Printer | undefined;

    protected remoteModuleRegistry: string | undefined;

    protected localModuleCacheLocation: string | undefined;

    protected modulePrefix: string | undefined;

    protected pluginRegistry: PluginRegistry | undefined;

    /**
     * Expects:
     *
     * * a config with the following properties defined:
     * ** `remoteModuleRegistry`: plugin module remote registry location string. If not provided, the default is
     * `https://registry.npmjs.org/`
     * ** `localModuleCacheLocation`: plugin module local cache location string. If not provided, the default is
     * `os.homedir() + "/.npm"`
     * ** `modulePrefix`: a prefix string for plugin modules e.g. if a prefix of `@foo` is configured and a module
     * name `bar` is specified in an *install* or *uninstall* request then the module name used will be `@foo/bar`.
     * * an implementation of [[Printer]] service registered with the [[STDERR_PRINTER_SERVICE]] ID in the
     * provided [[Context]].
     * * an implementation of [[PluginRegistry]] service registered with the [[PLUGIN_REGISTRY_SERVICE]] ID in the
     * provided [[Context]].
     */
    public async doRun(commandArgs: CommandArgs, context: Context, name: string): Promise<void> {

        const config = context.commandConfigs.get(name);
        if (_.isUndefined(config)) {
            throw new Error('No command config provided!');
        }

        this.remoteModuleRegistry = config.remoteModuleRegistry as string | undefined;
        if (_.isUndefined(this.remoteModuleRegistry) || !_.isString(this.remoteModuleRegistry)) {
            throw new Error('Missing "remoteModuleRegistry" configuration or it is not a string!');
        }

        this.localModuleCacheLocation = config.localModuleCacheLocation as string | undefined;
        if (_.isUndefined(this.localModuleCacheLocation) || !_.isString(this.localModuleCacheLocation)) {
            throw new Error('Missing "localModuleCacheLocation" configuration or it is not a string!');
        }

        this.modulePrefix = config.modulePrefix as string | undefined;
        if (!_.isUndefined(this.modulePrefix) && !_.isString(this.modulePrefix)) {
            throw new Error('Missing "modulePrefix" configuration or it is not a string!');
        }

        this.printer = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (!this.printer) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        this.pluginRegistry = context.serviceRegistry.getServiceById(PLUGIN_REGISTRY_SERVICE) as unknown as
            PluginRegistry;
        if (!this.pluginRegistry) {
            throw new Error('PLUGIN_REGISTRY_SERVICE not available in context');
        }
    }
}

/**
 * This is a VERY simple implementation of NPM add functionality.
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
export class AddCommand extends AbstractPluginCommand implements SubCommand {

    public readonly name = 'add';

    public readonly description = 'Adds a plugin.';

    public readonly options: ReadonlyArray<Option> = [
        {
            name: 'version',
            description: 'Version of plugin to be added. (Default is to add the latest version.)',
            isOptional: true
        }
    ];

    public readonly positionals: ReadonlyArray<Positional> = [
        {
            name: 'name',
            description: 'Name of the plugin to be added.'
        }
    ];

    /**
     * @inheritdoc
     *
     * Installs a specified plugin.
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {

        try {
            await this.doRun(commandArgs, context, this.name);

            let name = commandArgs.name as string;

            if (!_.isUndefined(this.modulePrefix)) {
                name = `${this.modulePrefix}${name}`;
            }

            this.printer!.showSpinner(`Adding: ${name}`);

            const version = commandArgs.version as string | undefined;

            const packageLocation = this.pluginRegistry!.pluginLocation!;

            // get list of currently installed packages
            const installedPackages = await getAllInstalledPackages(packageLocation);

            const installedPackageNamesAndVersions: { [packageName: string]: string } = {};
            installedPackages.forEach((spec) => {
                const [packageName, packageVersion] = spec.split('@');
                installedPackageNamesAndVersions[packageName] = packageVersion;
            });

            const packagesToInstall = await getDependencies(this.remoteModuleRegistry!,
                this.localModuleCacheLocation!, name, version);

            const constPackageNamesAndVersionsToInstall = packagesToInstall.map(
                (spec) => spec.split('@')
            );

            for (const packageNameAndVersionToInstall of constPackageNamesAndVersionsToInstall) {

                const packageName = packageNameAndVersionToInstall[0];
                const packageVersion = packageNameAndVersionToInstall[1];

                // check if package already installed
                if (!_.isUndefined(installedPackageNamesAndVersions[packageName])) {
                    if (installedPackageNamesAndVersions[packageName] !== packageVersion) {
                        throw new Error(`Multiple versions are not supported! Requested: ${
                            packageName}@${packageVersion}, Installed: ${
                            packageName}@${installedPackageNamesAndVersions[packageName]}`);
                    }
                } else {
                    // install package
                    await installPackage(packageLocation, this.remoteModuleRegistry!,
                        this.localModuleCacheLocation!, `${packageName}@${packageVersion}`);

                    // add installed package to installed list
                    installedPackageNamesAndVersions[packageName] = packageVersion;
                }
            }
        } catch (err) {
            const message = `Unable to add plugin ${commandArgs.name}: ${err.message}`;
            this.printer!.error(message, Icon.FAILURE);
            throw new Error(message);
        } finally {
            this.printer!.hideSpinner();
        }
    }
}

/**
 * This is a VERY simple implementation of NPM remove functionality.
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
export class RemoveCommand extends AbstractPluginCommand implements SubCommand {

    public readonly name = 'remove';

    public readonly description = 'Removes a plugin.';

    public readonly options: ReadonlyArray<Option> = [];

    public readonly positionals: ReadonlyArray<Positional> = [
        {
            name: 'name',
            description: 'Name of the plugin to be removed.'
        }
    ];

    /**
     * @inheritdoc
     *
     * Uninstalls a specified plugin.
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {

        try {
            await this.doRun(commandArgs, context, this.name);

            let name = commandArgs.name as string;

            if (!_.isUndefined(this.modulePrefix)) {
                name = `${this.modulePrefix}${name}`;
            }

            this.printer!.showSpinner(`Removing: ${name}`);

            const packageLocation = this.pluginRegistry!.pluginLocation!;

            // get list of currently installed non-dependency packages
            let topLevelPackages = await getInstalledTopLevelPackages(packageLocation);

            // look for package to delete
            const found = topLevelPackages.find((packageSpec) => packageSpec.startsWith(name));

            // return if nothing to do
            if (_.isUndefined(found)) {
                return;
            }

            // remove specified package from top level list
            topLevelPackages = topLevelPackages.filter((packageSpec) => packageSpec === found);

            // build dependency list from top level list
            const requiredPackages = await getInstalledDependencies(packageLocation, topLevelPackages);

            const packagesToUninstall = await getDependencies(this.remoteModuleRegistry!,
                this.localModuleCacheLocation!, name, found.split('@')[1]);

            for (const packageToUninstall of packagesToUninstall) {

                // check if package not still required
                if (!requiredPackages.includes(packageToUninstall)) {

                    // uninstall package
                    await uninstallPackage(packageLocation, packageToUninstall);
                }
            }
        } catch (err) {
            const message = `Unable to remove plugin ${commandArgs.name}: ${err.message}`;
            this.printer!.error(message, Icon.FAILURE);
            throw new Error(message);
        } finally {
            this.printer!.hideSpinner();
        }
    }
}
