/**
 * @module @flowscripter/cli-framework
 */

import Command from './Command';

/**
 * Interface to be implemented by a [[CommandFactory]] allowing a [[CLI]] to load [[Command]] implementations.
 */
export default interface CommandFactory {

    /**
     * Return all [[Command]] instances supplied by this factory.
     *
     * @return iterable of [[Command]] instances
     */
    getCommands(): Iterable<Command>;
}
