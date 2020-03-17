/**
 * @module @flowscripter/cli-framework
 */

import Context from './Context';
import Command from './Command';

/**
 * Interface used by a [[CLI]] to parse arguments and run a [[Command]].
 */
export default interface Runner {

    /**
     * Parse arguments, discover [[Command]] names and [[Argument]] values and run using the specified [[Context]].
     *
     * @param args the command line arguments to the [[CLI]] process (not including the name of the executable).
     * @param context the context for the [[Command]].
     * @param commands all [[Command]] instances which are known to the CLI.
     * @param defaultCommand optional [[Command]] implementation.
     * @return if there was an error parsing the provided args or the command fails to run,
     * a message indicating the reason will be returned.
     */
    run(args: string[], context: Context, commands: Command[], defaultCommand?: Command): Promise<string | undefined>;
}
