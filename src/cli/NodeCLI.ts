/** global process */

/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import path from 'path';
import debug from 'debug';
import { CommandArgs } from '../api/Command';
import AbstractNodeCLI, { packageInfo } from './AbstractNodeCLI';

/**
 * Node command line process implementation of a [[CLI]].
 */
export default class NodeCLI extends AbstractNodeCLI {

    protected readonly log: debug.Debugger = debug('NodeCLI');

    /**
     * Constructor taking an optional name.
     *
     * A [[CLIConfig]] will be created with the following properties:
     *
     * * `name`: taken from the `package.json` file if the optional name is not specified.
     * * `description`: taken from the `package.json` file.
     * * `version`: taken from the `package.json` file.
     * * `stdin`: `process.stdin`.
     * * `stdout`: `process.stdout`.
     * * `stderr`: `process.stderr`.
     * ** `pluginManagerConfig.pluginManager`: the NodePluginManager implementation class from esm-dynamic-plugins.
     * ** `pluginManagerConfig.pluginLocation`: `<process.cwd()>/node_modules`
     *
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     * @param serviceConfigs an optional [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs an optional [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     */
    public constructor(name?: string, serviceConfigs?: Map<string, any>, commandConfigs?: Map<string, CommandArgs>) {
        super({
            name: name || packageInfo.name,
            description: packageInfo.description,
            version: packageInfo.version,
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
            pluginManagerConfig: {
                pluginManager: NodePluginManager,
                pluginLocation: path.join(process.cwd(), 'node_modules')
            }
        }, serviceConfigs, commandConfigs);
    }
}
