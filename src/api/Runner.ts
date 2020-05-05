/**
 * @module @flowscripter/cli-framework-api
 */

import Context from './Context';
import Command from './Command';

/**
 * Possible return values for the [[run]] invocation.
 */
export enum RunResult {

    /**
     * Arguments were successfully parsed and specified command(s) were successfully executed.
     */
    Success = 'SUCCESS',

    /**
     * The arguments supplied were invalid or could not be parsed.
     */
    ParseError = 'PARSE_ERROR',

    /**
     * Arguments were successfully parsed but the specified command(s) failed.
     */
    CommandError = 'COMMAND_ERROR',

    /**
     * Some other error than caused by parsing or command execution occurred.
     */
    GeneralError = 'GENERAL_ERROR'
}

/**
 * Interface used by a [[CLI]] to parse arguments and run a [[Command]].
 */
export default interface Runner {

    /**
     * Parse arguments, discover [[Command]] names and [[Argument]] values and run using the specified [[Context]].
     *
     * @param args the command line arguments to the [[CLI]] process (not including the name of the executable).
     * @param context the context for the [[Command]].
     * @param defaultCommand optional [[Command]] implementation.
     * @return the result of parsing and executing command(s)
     */
    run(args: string[], context: Context, defaultCommand?: Command): Promise<RunResult>;
}
