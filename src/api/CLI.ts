/**
 * @module @flowscripter/cli-framework
 */

import ServiceFactory from './ServiceFactory';
import CommandFactory from './CommandFactory';

/**
 * Interface to be implemented by a [[CLI]] application.
 */
export default interface CLI {

    /**
     * Get all [[CommandFactory]] instances in use by this [[CLI]].
     *
     * @return iterable of [[CommandFactory]] instances
     */
    getCommandFactories(): Iterable<CommandFactory>;

    /**
     * Get all [[ServiceFactory]] instances in use by this [[CLI]].
     *
     * @return iterable of [[ServiceFactory]] instances
     */
    getServiceFactories(): Iterable<ServiceFactory>;

    /**
     * Execute the CLI.
     */
    execute(): Promise<void>;
}
