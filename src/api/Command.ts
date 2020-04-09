/**
 * @module @flowscripter/cli-framework-api
 */

import Context from './Context';
import { ArgumentValueType } from './ArgumentValueType';

/**
 * A container object for the parsed arguments supplied to a command.
 */
export interface CommandArgs {
    [argName: string]: ArgumentValueType;
}

/**
 * Common interface for all command types.
 */
export default interface Command {

    /**
     * Name of the command.
     *
     * Must consist of alphanumeric non-whitespace ASCII characters or `_` and `-` characters. Cannot start with `-`.
     */
    readonly name: string;

    /**
     * Optional description of the command.
     */
    readonly description?: string;

    /**
     * Run the command.
     *
     * @param commandArgs the arguments for the command.
     * @param context the [[Context]] in which to run.
     */
    run(commandArgs: CommandArgs, context: Context): Promise<void>;
}
