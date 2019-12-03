/**
 * @module @flowscripter/cli-framework
 */

import Service from './Service';

/**
 * Interface to be implemented by a [[ServiceFactory]] allowing a [[CLI]] to load [[Service]] implementations.
 */
export default interface ServiceFactory {

    /**
     * Return all [[Service]] instances supplied by this factory.
     *
     * @return iterable of [[Service]] instances
     */
    getServices(): Iterable<Service>;
}
