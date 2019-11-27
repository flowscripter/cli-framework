/**
 * @module @flowscripter/cli-framework
 */

import ServiceFactory from './ServiceFactory';
import CommandFactory from './CommandFactory';

/**
 * Interface to be implemented by a [[CLI]] application.
 *
 * @typeparam S_ID is the type of the Service IDs used by this [[CLI]] instance.
 */
export default interface CLI<S_ID> {

    /**
     * Get all [[CommandFactory]] instances in use by this [[CLI]].
     *
     * @return iterable of [[CommandFactory]] instances
     */
    getCommandFactories(): Iterable<CommandFactory<S_ID>>;

    /**
     * Get all [[ServiceFactory]] instances in use by this [[CLI]].
     *
     * @return iterable of [[ServiceFactory]] instances
     */
    getServiceFactories(): Iterable<ServiceFactory<S_ID>>;

    /**
     * Execute the CLI.
     */
    execute(): Promise<void>;
}
