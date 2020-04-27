/**
 * @module @flowscripter/cli-framework-api
 */

import Service from './Service';

/**
 * Interface used by a [[CLI]] to register [[Service]] implementations.
 */
export default interface ServiceRegistry {

    /**
     * Return all [[Service]] instances registered in order of descending [[Service.initPriority]]
     *
     * @return iterable of [[Service]] instances
     */
    getServices(): Iterable<Service>;

    /**
     * Return the specified [[Service]].
     *
     * @param id the ID of the [[Service]] to retrieve.
     *
     * @return the desired [[Service]]
     */
    getServiceById(id: string): Service | undefined;

    /**
     * Add the specified [[Service]] to the registry.
     *
     * @param service the [[Service]] to register.
     */
    addService(service: Service): void;
}
