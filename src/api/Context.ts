/**
 * @module @flowscripter/cli-framework
 */

import Service from './Service';
import { CommandArgs } from './Command';

/**
 * Interface to be implemented by a [[CommandFactory]] allowing a [[CLI]] to pass context to a [[Command]].
 */
export default interface Context {

    /**
     * The [[Service]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Service.id]] values and the map values are generic configuration objects.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly serviceConfigs: Map<string, any>;

    /**
     * The [[Command]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Command.name]] values and the map values are in the form of
     * [[CommandArgs]].
     */
    readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * Return the specified [[Service]]
     *
     * @param id the ID of the [[Service]] to retrieve.
     *
     * @return the desired [[Service]] or `null` if the specified service was not found.
     */
    getService(id: string): Service | null;
}
