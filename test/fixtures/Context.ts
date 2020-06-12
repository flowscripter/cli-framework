/* eslint-disable @typescript-eslint/no-explicit-any */

import { CommandArgs, Context } from '../../src';
import DefaultContext from '../../src/runtime/DefaultContext';
import DefaultServiceRegistry from '../../src/runtime/DefaultServiceRegistry';
import Command from '../../src/api/Command';
import Service from '../../src/api/Service';
import { getCommandRegistry } from './CommandRegistry';
import CLIConfig from '../../src/api/CLIConfig';

// eslint-disable-next-line import/prefer-default-export
export function getContext(cliConfig: CLIConfig, services: Service[], commands: Command[],
    serviceConfigs?: Map<string, any>, commandConfigs?: Map<string, CommandArgs>): Context {

    const serviceRegistry = new DefaultServiceRegistry();

    services.forEach((service) => { serviceRegistry.addService(service); });

    return new DefaultContext(cliConfig, serviceRegistry, getCommandRegistry(commands),
        serviceConfigs || new Map(), commandConfigs || new Map());
}
