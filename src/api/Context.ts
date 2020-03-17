/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import Service from './Service';
import Command, { CommandArgs } from './Command';

/**
 * Interface allowing a [[CLI]] to pass context to a [[Command]] instance.
 */
export default interface Context {

    /**
     * A generic configuration object for this [[CLI]].
     */
    readonly cliConfig: any;

    /**
     * The [[Service]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Service.id]] values and the map values are generic configuration objects.
     */
    readonly serviceConfigs: Map<string, any>;

    /**
     * The [[Command]] configuration objects for this [[Context]].
     *
     * The keys for the config map are [[Command.name]] values and the map values are in the form of [[CommandArgs]].
     */
    readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * All [[Command]] instances which are known to the CLI.
     */
    readonly commands: Command[];

    /**
     * Return the specified [[Service]].
     *
     * @param id the ID of the [[Service]] to retrieve.
     *
     * @return the desired [[Service]] or `null` if the specified service was not found.
     */
    getService(id: string): Service | null;
}
