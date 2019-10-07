/**
 * @module @flowscripter/cli-framework
 */

import Command from './Command';

/**
 * Interface to be implemented by a [[CommandFactory]] allowing a [[CLI]] to load [[Command]] implementations.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface CommandFactory<S_ID> {

    /**
     * Return all [[Command]] instances supplied by this factory.
     *
     * @return iterable of [[Command]]
     */
    getCommands(): Iterable<Command<S_ID>>;
}
