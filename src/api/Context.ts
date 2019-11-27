/**
 * @module @flowscripter/cli-framework
 */

import Service from './Service';

/**
 * Interface to be implemented by a [[CommandFactory]] allowing a [[CLI]] to pass context to a [[Command]].
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Context<S_ID> {

    /**
     * Return the specified [[Service]]
     *
     * @param serviceId the ID of the [[Service]] to retrieve.
     *
     * @return the desired [[Service]] or `null` if the specified service was not found.
     */
    getService(serviceId: S_ID): Service<S_ID> | null;
}
