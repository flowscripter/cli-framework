/**
 * @module @flowscripter/cli-framework
 */

import Service from './Service';

/**
 * Interface to be implemented by a [[ServiceFactory]] allowing a [[CLI]] to load [[Service]] implementations.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface ServiceFactory<S_ID> {

    /**
     * Return all [[Service]] instances supplied by this factory.
     *
     * @return iterable of [[Service]]
     */
    getServices(): Iterable<Service<S_ID>>;
}
