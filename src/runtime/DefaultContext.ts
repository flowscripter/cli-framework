/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import Context from '../api/Context';
import { CommandArgs } from '..';
import ServiceRegistry from '../api/ServiceRegistry';
import CommandRegistry from '../api/CommandRegistry';
import CLIConfig from '../api/CLIConfig';

/**
 * Default implementation of a [[Context]].
 */
export default class DefaultContext implements Context {

    public readonly cliConfig: any;

    public readonly serviceRegistry: ServiceRegistry;

    public readonly commandRegistry: CommandRegistry;

    public readonly serviceConfigs: Map<string, any>;

    public readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * Construct the context with the provided CLI configuration object, [[ServiceRegistry]] and [[CommandRegistry]]
     * implementations and service and command configs.
     *
     * @param cliConfig a CLI configuration object.
     * @param commandRegistry the [[CommandRegistry]] instance to use for this [[Context]].
     * @param serviceRegistry the [[ServiceRegistry]] instance to use for this [[Context]].
     * @param serviceConfigs [[Service]] configuration objects to make available in the context. This should be a map
     * where the keys are [[Service.id]] values and the values are generic configuration objects.
     * @param commandConfigs [[Command]] configuration objects to make available in the context. This should be a map
     * where the keys are [[Command.name]] values and the values are in the form of [[CommandArgs]].
     *
     * @throws *Error* if [[Service]] instances are provided with duplicate IDs.
     */
    public constructor(cliConfig: CLIConfig, serviceRegistry: ServiceRegistry, commandRegistry: CommandRegistry,
        serviceConfigs: Map<string, any>, commandConfigs: Map<string, CommandArgs>) {

        this.cliConfig = cliConfig;
        this.serviceRegistry = serviceRegistry;
        this.commandRegistry = commandRegistry;
        this.serviceConfigs = serviceConfigs;
        this.commandConfigs = commandConfigs;
    }
}
