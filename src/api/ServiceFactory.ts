/**
 * @module @flowscripter/cli-framework-api
 */

import Service from './Service';

/**
 * Interface used by a [[CLI]] to load [[Service]] implementations.
 */
export default interface ServiceFactory {

    /**
     * Return all [[Service]] instances supplied by this factory.
     *
     * @return iterable of [[Service]] instances
     */
    getServices(): Iterable<Service>;
}
