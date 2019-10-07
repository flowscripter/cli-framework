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
     * Return all [[CommandFactory]] instances in use by this [[CLI]].
     *
     * @return array of [[CommandFactory]]
     */
    readonly commandFactories: CommandFactory<S_ID>[];

    /**
     * Return all [[ServiceFactory]] instances in use by this [[CLI]].
     *
     * @return array of [[ServiceFactory]]
     */
    readonly serviceFactories: ServiceFactory<S_ID>[];

    /**
     * Execute the CLI.
     *
     * This will:
     * 1. populate a [[Context]] with all [[Service]] instances
     * 2. populate a [[Runner]] with all [[Command]] instances
     * 3. invoke the [[Runner]] passing in the [[Context]]
     */
    execute(): Promise<void>;
}
