/**
 * @module @flowscripter/cli-framework-api
 */

import { CommandArgs } from './Command';
import CommandRegistry from './CommandRegistry';
import ServiceRegistry from './ServiceRegistry';
import CLIConfig from './CLIConfig';

/**
 * Interface allowing a [[CLI]] to pass context to a [[Command]] instance.
 */
export default interface Context {

    /**
     * A generic configuration object for this [[CLI]].
     */
    readonly cliConfig: CLIConfig;

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
     * The keys for the config map are [[Command.name]] values and the map values are in the form of [[CommandArgs]].
     */
    readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * The [[CommandRegistry]] instance in use by the CLI.
     */
    readonly commandRegistry: CommandRegistry;

    /**
     * The [[ServiceRegistry]] instance in use by the CLI.
     */
    readonly serviceRegistry: ServiceRegistry;
}
