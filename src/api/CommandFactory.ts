/**
 * @module @flowscripter/cli-framework-api
 */

import Command from './Command';

/**
 * Interface used by a [[CLI]] to load [[Command]] implementations.
 */
export default interface CommandFactory {

    /**
     * Return all [[Command]] instances supplied by this factory.
     *
     * @return iterable of [[Command]] instances
     */
    getCommands(): Iterable<Command>;
}
