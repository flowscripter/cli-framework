/**
 * @module @flowscripter/cli-framework-api
 */

import { RunResult } from './Runner';

/**
 * Interface to be implemented by a CLI application.
 */
export default interface CLI {

    /**
     * Execute the CLI with the provided arguments.
     *
     * @param args the arguments to parse
     *
     * @return result of parsing and executing
     */
    execute(args: string[]): Promise<RunResult>;
}
