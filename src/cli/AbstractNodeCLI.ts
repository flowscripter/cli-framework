/** global process */

/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import debug from 'debug';
import BaseCLI from './BaseCLI';
import { RunResult } from '../api/Runner';

export const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));

/**
 * Abstract Node command line process implementation of a [[CLI]] handling arguments and process termination.
 */
export default abstract class AbstractNodeCLI extends BaseCLI {

    protected readonly log: debug.Debugger = debug('AbstractNodeCLI');

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
            process.exit(runResult === RunResult.Success ? 0 : 1);
        } catch (err) {
            this.log(`execution error: ${err.message}`);
            process.exit(1);
            runResult = RunResult.GeneralError;
        }
        return runResult;
    }
}
