/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import Context from '../api/Context';
import Service from '../api/Service';
import { CommandArgs } from '..';
import Command from '../api/Command';

/**
 * Default implementation of a [[Context]].
 */
export default class DefaultContext implements Context {

    private readonly servicesById: Map<string, Service> = new Map<string, Service>();

    readonly commands: Command[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly cliConfig: any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly serviceConfigs: Map<string, any>;

    public readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * Construct the context with the provided CLI configuration object and list of [[Service]] instances.
     *
     * @param cliConfig a CLI configuration object.
     * @param commands the [[Command]] instances known to the CLI.
     * @param services the [[Service]] instances to make available in the context.
     * @param serviceConfigs [[Service]] configuration objects to make available in the context. This should be a map
     * where the keys are [[Service.id]] values and the values are generic configuration objects.
     * @param commandConfigs [[Command]] configuration objects to make available in the context. This should be a map
     * where the keys are [[Command.name]] values and the values are in the form of [[CommandArgs]].
     *
     * @throws *Error* if [[Service]] instances are provided with duplicate IDs.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,max-len
    public constructor(cliConfig: any, services: Service[], commands: Command[], serviceConfigs: Map<string, any>, commandConfigs: Map<string, CommandArgs>) {

        this.cliConfig = cliConfig;
        this.commands = commands;
        this.serviceConfigs = serviceConfigs;
        this.commandConfigs = commandConfigs;

        services.forEach((service) => {
            if (!_.isUndefined(this.servicesById.get(service.id))) {
                throw new Error(`Duplicate service ID: ${service.id} discovered!`);
            }
            this.servicesById.set(service.id, service);
        });
    }

    /**
     * @inheritdoc
     */
    public getService(id: string): Service | null {

        const service = this.servicesById.get(id);

        if (_.isUndefined(service)) {
            return null;
        }
        return service;
    }
}
