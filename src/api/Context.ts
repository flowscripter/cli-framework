/**
 * @module @flowscripter/cli-framework
 */

import Service from './Service';

/**
 * Interface to be implemented by a [[CommandFactory]] allowing a [[CLI]] to pass context to a [[Command]].
 */
export default interface Context {

    /**
     * The [[Service]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Service.id]] values and the map values are configuration objects.
     */
    readonly serviceConfigs: Map<string, object>;

    /**
     * The [[Command]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Command.name]] values and the map values are configuration objects.
     */
    readonly commandConfigs: Map<string, object>;

    /**
     * Return the specified [[Service]]
     *
     * @param id the ID of the [[Service]] to retrieve.
     *
     * @return the desired [[Service]] or `null` if the specified service was not found.
     */
    getService(id: string): Service | null;
}
