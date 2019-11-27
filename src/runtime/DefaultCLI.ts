/**
 * @module @flowscripter/cli-framework
 */

import CLI from '../api/CLI';
import CommandFactory from '../api/CommandFactory';
import ServiceFactory from '../api/ServiceFactory';
import DefaultRunner from './DefaultRunner';
import DefaultContext from './DefaultContext';
import { PRINTER_SERVICE } from '../core/service/PrinterService';

/**
 * Default implementation of a [[CLI]].
 */
export default class DefaultCLI implements CLI<string> {

    private readonly commandFactories: CommandFactory<string>[] = [];

    private readonly serviceFactories: ServiceFactory<string>[] = [];

    private context = new DefaultContext<string>();

    private runner = new DefaultRunner<string>(PRINTER_SERVICE);

    /**
     * @inheritdoc
     *
     * Obtains arguments for parsing from the Node process arguments and drops the first two
     * which will be the node executable and the main entry module.
     */
    public async execute(): Promise<void> {
        await this.runner.run(process.argv.slice(2), this.context);
    }

    /**
     * @inheritdoc
     */
    public getCommandFactories(): Iterable<CommandFactory<string>> {
        return this.commandFactories;
    }

    /**
     * @inheritdoc
     */
    public getServiceFactories(): Iterable<ServiceFactory<string>> {
        return this.serviceFactories;
    }

    /**
     * Add a [[CommandFactory]] to the [[CLI]].
     *
     * All [[Command]] instances provided by the [[CommandFactory]] will be added to the [[Runner]].
     *
     * @param commandFactory the [[CommandFactory]] instance to add
     */
    public addCommandFactory(commandFactory: CommandFactory<string>): void {
        this.commandFactories.push(commandFactory);

        for (const command of commandFactory.getCommands()) {
            this.runner.addCommand(command);
        }
    }

    /**
     * Add a [[ServiceFactory]] to the list of those which will be used to make available
     * in the [[Context]] the next time [[execute]] is invoked.
     *
     * @param serviceFactory the [[ServiceFactory]] instance to add
     */
    public addServiceFactory(serviceFactory: ServiceFactory<string>): void {
        this.serviceFactories.push(serviceFactory);
        this.context.addServiceFactory(serviceFactory);
    }
}
