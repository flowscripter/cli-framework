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
     *
     * @throws *Error* if a [[Command]] with the same [[Command.name]] or [[Command.aliases]] is
     * added or if more than one [[Command]] is added with [[Command.isDefault]] set to `true`.
     */
    addCommand(command: Command<S_ID>): void;

    /**
     * Run a [[Command]] with arguments parsed from the specified arguments
     * using the specified [[Context]].
     *
     * @param args the command line arguments to the [[CLI]] process (not including the name of the executable
     * e.g. `argv[0]`)
     * @param context the context for the [[Command]]
     *
     * @throws *Error* if a [[Command]] could not be found matching the args or running the [[Command]] failed.
     */
    run(args: string[], context: Context<S_ID>): Promise<void>;
}
