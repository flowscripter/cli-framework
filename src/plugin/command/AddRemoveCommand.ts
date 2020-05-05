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
import Printer, { STDERR_PRINTER_SERVICE } from '../../core/service/PrinterService';
import PluginRegistry, { PLUGIN_REGISTRY_SERVICE } from '../service/PluginRegistryService';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getDependencies,
    getInstalledDependencies,
    installPackage,
    uninstallPackage
} from './NpmPackageUtils';

export const ADD_COMMAND_NAME = 'add';
export const REMOVE_COMMAND_NAME = 'remove';

abstract class AbstractPluginCommand {

    protected printer: Printer | undefined;

    protected remoteModuleRegistry: string | undefined;

    protected pluginRegistry: PluginRegistry | undefined;

    /**
     * Expects:
     *
     * * a config with the following properties defined:
     * ** `remoteModuleRegistry`: plugin module remote registry location string. If not provided, the default is
     * `https://registry.npmjs.org/`
     * * an implementation of [[Printer]] service registered with the [[STDERR_PRINTER_SERVICE]] ID in the
     * provided [[Context]].
     * * an implementation of [[PluginRegistry]] service registered with the [[PLUGIN_REGISTRY_SERVICE]] ID in the
     * provided [[Context]].
     */
    public async doRun(commandArgs: CommandArgs, context: Context, name: string): Promise<void> {

        const config = context.commandConfigs.get(name);
        if (_.isUndefined(config)) {
            throw new Error(`No command config provided for command: ${name}!`);
        }

        this.remoteModuleRegistry = config.remoteModuleRegistry as string | undefined;
        if (_.isUndefined(this.remoteModuleRegistry) || !_.isString(this.remoteModuleRegistry)) {
            throw new Error('Missing "remoteModuleRegistry" configuration or it is not a string!');
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

    public readonly name = ADD_COMMAND_NAME;

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

        await this.doRun(commandArgs, context, this.name);
        try {
            let name = commandArgs.name as string;
            const version = commandArgs.version as string | undefined || 'latest';

            if (!_.isUndefined(this.pluginRegistry!.moduleScope)) {
                name = `${this.pluginRegistry!.moduleScope}/${name}`;
            }

            this.printer!.showSpinner(`Adding: ${name}`);

            const packageLocation = this.pluginRegistry!.pluginLocation!;

            // get list of currently installed packages
            const installedPackageSpecs = await getAllInstalledPackages(packageLocation);

            const packageSpecsToInstall = await getDependencies(this.remoteModuleRegistry!, { name, version });

            for (const currentPackageSpec of packageSpecsToInstall) {

                // check if package already installed
                const found = installedPackageSpecs.find((packageSpec) => packageSpec.name === currentPackageSpec.name);
                if (found) {
                    if (found.version !== currentPackageSpec.version) {
                        throw new Error(`Multiple versions are not supported! Requested: ${
                            currentPackageSpec.name}@${currentPackageSpec.version}, Installed: ${
                            found.name}@${found.version}`);
                    }
                } else {
                    // install package
                    await installPackage(packageLocation, currentPackageSpec);

                    // add installed package to installed list
                    installedPackageSpecs.push(currentPackageSpec);
                }
            }
        } catch (err) {
            throw new Error(`Unable to add plugin ${commandArgs.name}: ${err.message}`);
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

    public readonly name = REMOVE_COMMAND_NAME;

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

        await this.doRun(commandArgs, context, this.name);
        try {
            let name = commandArgs.name as string;

            if (!_.isUndefined(this.pluginRegistry!.moduleScope)) {
                name = `${this.pluginRegistry!.moduleScope}/${name}`;
            }

            this.printer!.showSpinner(`Removing: ${name}`);

            const packageLocation = this.pluginRegistry!.pluginLocation!;

            // get list of currently installed non-dependency packages
            let topLevelPackages = await getInstalledTopLevelPackages(packageLocation);

            // look for package to delete
            const found = topLevelPackages.find((packageSpec) => packageSpec.name === name);

            // return if nothing to do
            if (_.isUndefined(found)) {
                return;
            }

            // remove specified package from top level list
            topLevelPackages = topLevelPackages.filter((packageSpec) => packageSpec === found);

            // build dependency list from top level list
            const requiredPackages = await getInstalledDependencies(packageLocation, topLevelPackages);

            const packagesToUninstall = await getDependencies(this.remoteModuleRegistry!, found);

            for (const packageToUninstall of packagesToUninstall) {

                // check if package not still required
                if (!requiredPackages.includes(packageToUninstall)) {

                    // uninstall package
                    await uninstallPackage(packageLocation, packageToUninstall);
                }
            }
        } catch (err) {
            throw new Error(`Unable to remove plugin ${commandArgs.name}: ${err.message}`);
        } finally {
            this.printer!.hideSpinner();
        }
    }
}
