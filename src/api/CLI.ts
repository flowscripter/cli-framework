/**
 * @module @flowscripter/cli-framework-api
 */

import ServiceFactory from './ServiceFactory';
import CommandFactory from './CommandFactory';
import { RunResult } from './Runner';

/**
 * Interface to be implemented by a CLI application.
 */
export default interface CLI {

    /**
     * All [[CommandFactory]] instances known to this [[CLI]].
     */
    readonly commandFactories: CommandFactory[];

    /**
     * All [[ServiceFactory]] instances known to this [[CLI]].
     */
    readonly serviceFactories: ServiceFactory[];

    /**
     * Execute the CLI with the provided arguments.
     *
     * @param args the arguments to parse
     *
     * @return result of parsing and executing
     */
    execute(args: string[]): Promise<RunResult>;
}
