/**
 * @module @flowscripter/cli-framework
 */

import Context from './Context';
import Command from './Command';

/**
 * Interface to be implemented by a [[Runner]] allowing a [[CLI]] to run a [[Command]].
 */
export default interface Runner {

    /**
     * Add the specified [[Command]] instance to this [[Runner]].
     *
     * @param command the [[Command]] to add.
     */
    addCommand(command: Command): void;

    /**
     * Parse arguments, discover [[Command]] names and [[Argument]] values and run
     * using the specified [[Context]].
     *
     * @param args the command line arguments to the [[CLI]] process (not including the name of the executable
     * e.g. `argv[0]`)
     * @param context the context for the [[Command]]
     */
    run(args: string[], context: Context): Promise<void>;
}
