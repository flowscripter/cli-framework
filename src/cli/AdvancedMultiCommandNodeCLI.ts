/**
 * @module @flowscripter/cli-framework
 */

/** global process */

/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import debug from 'debug';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import BaseNodeCLI from './BaseNodeCLI';
import { MultiCommandHelpGlobalCommand, MultiCommandHelpSubCommand } from '../core/command/HelpCommand';
import UsageCommand from '../core/command/UsageCommand';
import { PrompterService } from '../core/service/PrompterService';
import { ConfigurationService } from '../core/service/ConfigurationService';
import { PluginRegistryService, PLUGIN_REGISTRY_SERVICE } from '../plugin/service/PluginRegistryService';
import { StderrPrinterService, StdoutPrinterService } from '../core/service/PrinterService';
import VersionCommand from '../core/command/VersionCommand';
import LogLevelCommand from '../core/command/LogLevelCommand';
import ConfigCommand from '../core/command/ConfigCommand';
import { ColorCommand, NoColorCommand } from '../core/command/ColorCommand';
import Context from '../api/Context';
import Service from '../api/Service';
import {
    COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
    handleLoadedCommandFactory
} from '../plugin/CommandFactory';
import {
    handleLoadedServiceFactory,
    SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID
} from '../plugin/ServiceFactory';
import Command, { CommandArgs } from '../api/Command';

/**
 * Node command line process implementation of a [[CLI]] configured for a multiple
 * command application with advanced features.
 */
export default class AdvancedMultiCommandNodeCLI extends BaseNodeCLI {

    protected readonly log: debug.Debugger = debug('AdvancedMultiCommandNodeCLI');

    protected static readonly helpGlobalCommand = new MultiCommandHelpGlobalCommand();

    protected static readonly hintCommand = new UsageCommand(AdvancedMultiCommandNodeCLI.helpGlobalCommand);

    protected static readonly usageCommand = new UsageCommand(AdvancedMultiCommandNodeCLI.helpGlobalCommand, false);

    /**
     * Constructor taking an optional name.
     *
     * Similar to [[SimpleMultiCommandNodeCLI]], it configures the CLI with
     * `stdout` and `stderr` [[PrinterService]] implementations,
     * a [[PrompterService]] implementation and help, usage and version support.
     *
     * In addition, a [[ConfigurationService]] implementation and commands for color output control, log level control,
     * and configuration location specification are provided.
     *
     * Plugin support is also provided via the addition of a [[PluginRegistryService]] and plugin management commands.
     * This uses a the NodePluginManager from esm-dynamic-plugins with a plugin location set to
     * `<process.cwd()>/node_modules`. This configuration can be customised by passing a
     * [[PluginManagerConfig]] in the [[serviceConfigs]] map with the key [[PLUGIN_REGISTRY_SERVICE]].
     *
     * @param services an array of [[Service]] implementations to be added to the CLI.
     * @param commands an array of [[Command]] implementations to be added to the CLI.
     * @param serviceConfigs a [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs a [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     */
    public constructor(services: Service[], commands: Command[],
        serviceConfigs: Map<string, any>, commandConfigs: Map<string, CommandArgs>, name?: string) {
        super([
            new ConfigurationService(100),
            new StderrPrinterService(90),
            new StdoutPrinterService(90),
            new PrompterService(90),
            new PluginRegistryService(80, new Map([
                [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                    handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
                [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                    handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
            ])),
            ...services
        ], [
            AdvancedMultiCommandNodeCLI.helpGlobalCommand,
            new MultiCommandHelpSubCommand(),
            new VersionCommand(),
            new ConfigCommand(100),
            new LogLevelCommand(90),
            new ColorCommand(80),
            new NoColorCommand(80),
            ...commands
        ], serviceConfigs.has(PLUGIN_REGISTRY_SERVICE)
            ? serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
                pluginManager: serviceConfigs.get(PLUGIN_REGISTRY_SERVICE).pluginManager
                    || NodePluginManager,
                pluginLocation: serviceConfigs.get(PLUGIN_REGISTRY_SERVICE).moduleScope
                    || path.join(process.cwd(), 'node_modules'),
                moduleScope: serviceConfigs.get(PLUGIN_REGISTRY_SERVICE).moduleScope
            })
            : serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
                pluginManager: NodePluginManager,
                pluginLocation: path.join(process.cwd(), 'node_modules')
            }), commandConfigs, name,
        AdvancedMultiCommandNodeCLI.hintCommand, AdvancedMultiCommandNodeCLI.usageCommand);
    }
}
