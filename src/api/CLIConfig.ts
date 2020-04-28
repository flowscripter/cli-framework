/**
 * @module @flowscripter/cli-framework-api
 */

import { Writable, Readable } from 'stream';
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
export default interface CLIConfig {

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
