/**
 * @module @flowscripter/cli-framework
 */

import Context from './Context';
import Command from './Command';

/**
 * Interface to be implemented by a [[Runner]] allowing a [[CLI]] to run a [[Command]].
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Runner<S_ID> {

    /**
     * Add the specified [[Command]] instance to this [[Runner]].
     *
     * @param command the [[Command]] to add.
     */
    addCommand(command: Command<S_ID>): void;

    /**
     * Parse arguments, discover [[Command]] names and [[Argument]] values and run
     * using the specified [[Context]].
     *
     * @param args the command line arguments to the [[CLI]] process (not including the name of the executable
     * e.g. `argv[0]`)
     * @param context the context for the [[Command]]
     */
    run(args: string[], context: Context<S_ID>): Promise<void>;
}
