/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** global process */

import fs from 'fs';
import debug from 'debug';
import BaseCLI from './BaseCLI';
import { RunResult } from '../api/Runner';
import Command, { CommandArgs } from '../api/Command';
import Service from '../api/Service';

const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));

/**
 * Basic Node command line process implementation of a [[CLI]]
 * taking CLI config from `package.json` and handling arguments and process termination.
 */
export default class BaseNodeCLI extends BaseCLI {

    protected readonly log: debug.Debugger = debug('BaseNodeCLI');

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
     *
     * @param services an array of [[Service]] implementations to be added to the CLI.
     * @param commands an array of [[Command]] implementations to be added to the CLI.
     * @param serviceConfigs a [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs a [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     * @param defaultCommand an optional command to be run if none are parsed from the arguments.
     * @param usageCommand an optional command to be run if there is an error parsing the arguments.
     */
    public constructor(services: Service[], commands: Command[],
        serviceConfigs: Map<string, any>, commandConfigs: Map<string, CommandArgs>,
        name?: string, defaultCommand?: Command, usageCommand?: Command) {
        super({
            name: name || packageInfo.name,
            description: packageInfo.description,
            version: packageInfo.version,
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        }, services, commands, serviceConfigs, commandConfigs, defaultCommand, usageCommand);
    }

    /**
     * Execute the CLI.
     *
     * Obtains arguments for parsing from the Node process arguments and drops the first two
     * which will be the node executable and the main entry module.
     *
     * Calls system exit with an exit code of `0` on a [[RunResult]] of `SUCCESS` and `1` otherwise.
     */
    public async execute(): Promise<RunResult> {
        let runResult: RunResult;
        try {
            runResult = await super.execute(process.argv.slice(2));
            this.log(`Run result: ${runResult}`);
            process.exit(runResult === RunResult.Success ? 0 : 1);
        } catch (err) {
            this.log(`Execution error: ${err.message}`);
            process.exit(1);
            runResult = RunResult.GeneralError;
        }
        return runResult;
    }
}
