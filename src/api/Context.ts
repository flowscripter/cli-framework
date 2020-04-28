/**
 * @module @flowscripter/cli-framework-api
 */

import { Writable, Readable } from 'stream';
import { CommandArgs } from './Command';
import CommandRegistry from './CommandRegistry';
import ServiceRegistry from './ServiceRegistry';
import { PluginManagerClass } from './PluginManagerClass';

/**
 * Interface specifying esm-dynamic-plugins PluginManager related configuration.
 */
export interface PluginManagerConfig {

    /**
     * An esm-dynamic-plugins PluginManager implementation class definition.
     */
    readonly pluginManager: PluginManagerClass;

    /**
     * A base storage location for plugins.
     */
    readonly pluginLocation: string;
}

/**
 * Interface specifying common configuration for a CLI application.
 */
export interface CliConfig {

    /**
     * Name of the application.
     */
    readonly name: string;

    /**
     * Description of the application.
     */
    readonly description: string;

    /**
     * Version of the application.
     */
    readonly version: string;

    /**
     * Readable to use for stdin.
     */
    readonly stdin: Readable;

    /**
     * Writable to use for stdout.
     */
    readonly stdout: Writable;

    /**
     * Writable to use for stderr.
     */
    readonly stderr: Writable;

    /**
     * Optional config for esm-dynamic-plugins based [[ServiceFactory]] and [[CommandFactory]] plugin support.
     */
    readonly pluginManagerConfig?: PluginManagerConfig;
}

/**
 * Interface allowing a [[CLI]] to pass context to a [[Command]] instance.
 */
export default interface Context {

    /**
     * A generic configuration object for this [[CLI]].
     */
    readonly cliConfig: CliConfig;

    /**
     * The [[Service]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Service.id]] values and the map values are generic configuration objects.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly serviceConfigs: Map<string, any>;

    /**
     * The [[Command]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Command.name]] values and the map values are in the form of [[CommandArgs]].
     */
    readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * The [[CommandRegistry]] instance in use by the CLI.
     */
    readonly commandRegistry: CommandRegistry;

    /**
     * The [[ServiceRegistry]] instance in use by the CLI.
     */
    readonly serviceRegistry: ServiceRegistry;
}
