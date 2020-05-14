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
import Printer, { Icon, STDERR_PRINTER_SERVICE, STDOUT_PRINTER_SERVICE } from '../../core/service/PrinterService';
import PluginRegistry, { PLUGIN_REGISTRY_SERVICE } from '../service/PluginRegistryService';
import {
    getInstalledPackages,
    resolvePackageSpec,
    installPackage,
    uninstallPackage
} from './NpmPackageUtils';

export const ADD_COMMAND_NAME = 'add';
export const REMOVE_COMMAND_NAME = 'remove';

abstract class AbstractPluginCommand {

    protected stderrPrinter: Printer | undefined;

    protected stdoutPrinter: Printer | undefined;

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
     * * an implementation of [[Printer]] service registered with the [[STDOUT_PRINTER_SERVICE]] ID in the
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
        this.stderrPrinter = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (!this.stderrPrinter) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }
        this.stdoutPrinter = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!this.stdoutPrinter) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        this.pluginRegistry = context.serviceRegistry.getServiceById(PLUGIN_REGISTRY_SERVICE) as unknown as
            PluginRegistry;
        if (!this.pluginRegistry) {
            throw new Error('PLUGIN_REGISTRY_SERVICE not available in context');
        }
    }
}

/**
 * This command uses VERY simple NPM functionality in [[NpmPackageUtils]] to add a plugin package.
 */
export class AddCommand extends AbstractPluginCommand implements SubCommand {

    public readonly name = ADD_COMMAND_NAME;

    public readonly description = 'Adds a plugin';

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

            this.stderrPrinter!.showSpinner(`Adding: ${name}`);

            const packageSpecToInstall = await resolvePackageSpec(this.remoteModuleRegistry!, { name, version });

            // get list of currently installed packages
            const packageLocation = this.pluginRegistry!.pluginLocation!;
            const installedPackageSpecs = await getInstalledPackages(packageLocation);

            // check if package already installed
            const found = installedPackageSpecs.find((packageSpec) => packageSpec.name === packageSpecToInstall.name);
            if (found) {
                if (found.version !== packageSpecToInstall.version) {
                    throw new Error(`Multiple versions are not supported! Requested: ${
                        packageSpecToInstall.name}@${packageSpecToInstall.version}, Installed: ${
                        found.name}@${found.version}`);
                }
                this.stdoutPrinter!.info(`${
                    this.stdoutPrinter!.gray('Already added:')} ${
                    packageSpecToInstall.name}@${packageSpecToInstall.version}\n`, Icon.SUCCESS);
                return;
            }
            // install package
            await installPackage(packageLocation, packageSpecToInstall);

            this.stdoutPrinter!.info(`${
                this.stdoutPrinter!.gray('Added:')} ${
                packageSpecToInstall.name}@${packageSpecToInstall.version}\n`, Icon.SUCCESS);
        } catch (err) {
            throw new Error(`Unable to add plugin ${commandArgs.name}: ${err.message}`);
        } finally {
            this.stderrPrinter!.hideSpinner();
        }
    }
}

/**
 * This command uses VERY simple NPM functionality in [[NpmPackageUtils]] to remove a plugin package.
 */
export class RemoveCommand extends AbstractPluginCommand implements SubCommand {

    public readonly name = REMOVE_COMMAND_NAME;

    public readonly description = 'Removes a plugin';

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

            this.stderrPrinter!.showSpinner(`Removing: ${name}`);

            const packageLocation = this.pluginRegistry!.pluginLocation!;

            // get list of currently installed packages
            const topLevelPackages = await getInstalledPackages(packageLocation);

            // look for package to delete
            const found = topLevelPackages.find((packageSpec) => packageSpec.name === name);

            // return if nothing to do
            if (_.isUndefined(found)) {
                return;
            }

            // uninstall package
            await uninstallPackage(packageLocation, found);

            this.stdoutPrinter!.info(`${this.stdoutPrinter!.gray('Removed:')} ${found.name}@${found.version}\n`,
                Icon.SUCCESS);
        } catch (err) {
            throw new Error(`Unable to remove plugin ${commandArgs.name}: ${err.message}`);
        } finally {
            this.stderrPrinter!.hideSpinner();
        }
    }
}
