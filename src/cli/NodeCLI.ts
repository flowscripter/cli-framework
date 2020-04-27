/** global process */

/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import path from 'path';
import fs from 'fs';
import debug from 'debug';
import BaseCLI from './BaseCLI';
import { CliConfig } from '../api/Context';
import { CommandArgs } from '..';

const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));

/**
 * Node command line process implementation of a [[CLI]].
 */
export default class NodeCLI extends BaseCLI {

    protected readonly log: debug.Debugger = debug('NodeCLI');

    /**
     * Constructor taking an optional config.
     *
     * If the optional [[CliConfig]] is not provided an internal config will be created with the following properties:
     *
     * * `name`: taken from the `package.json` file.
     * * `description`: taken from the `package.json` file.
     * * `version`: taken from the `package.json` file.
     * * `stdin`: `process.stdin`.
     * * `stdout`: `process.stdout`.
     * * `stderr`: `process.stderr`.
     * ** `pluginManagerConfig.pluginManager`: the NodePluginManager implementation class from esm-dynamic-plugins.
     * ** `pluginManagerConfig.pluginLocation`: `<process.cwd()>/node_modules`
     * ** `pluginManagerConfig.remoteRegistryLocation`: `https://registry.npmjs.org/`
     * ** `pluginManagerConfig.cacheLocation`: `<home_dir>/.npm`
     *
     * @param cliConfig an optional [[CliConfig]] object which will be made available in the [[Context]].
     * @param serviceConfigs optional service configurations to be made available in the [[Context]].
     * @param commandConfigs optional command configurations to be made available in the [[Context]].
     */
    public constructor(cliConfig?: CliConfig, serviceConfigs?: Map<string, any>,
        commandConfigs?: Map<string, CommandArgs>) {
        super(!_.isUndefined(cliConfig) ? cliConfig : {
            name: packageInfo.name,
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

    /**
     * Execute the CLI.
     *
     * Obtains arguments for parsing from the Node process arguments and drops the first two
     * which will be the node executable and the main entry module.
     *
     * Will call system exit with an exit code of `0` on successful execution and `1` for a failure
     */
    public async execute(): Promise<number> {
        try {
            const code = await super.execute(process.argv.slice(2));
            process.exit(code);
        } catch (err) {
            this.log(`execution error: ${err.message}`);
            process.exit(1);
        }
    }
}
