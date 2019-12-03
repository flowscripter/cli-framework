/**
 * @module @flowscripter/cli-framework
 */

import CLI from '../api/CLI';
import CommandFactory from '../api/CommandFactory';
import ServiceFactory from '../api/ServiceFactory';
import DefaultRunner from '../runtime/DefaultRunner';
import DefaultContext from '../runtime/DefaultContext';

/**
 * Base implementation of a [[CLI]].
 */
export default class BaseCLI implements CLI {

    private readonly commandFactories: CommandFactory[] = [];

    private readonly serviceFactories: ServiceFactory[] = [];

    private context = new DefaultContext();

    private runner = new DefaultRunner();

    // TODO: add constructor which takes output stream and config

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
    public getCommandFactories(): Iterable<CommandFactory> {
        return this.commandFactories;
    }

    /**
     * @inheritdoc
     */
    public getServiceFactories(): Iterable<ServiceFactory> {
        return this.serviceFactories;
    }

    /**
     * Add a [[CommandFactory]] to the [[CLI]].
     *
     * All [[Command]] instances provided by the [[CommandFactory]] will be added to the [[Runner]].
     *
     * @param commandFactory the [[CommandFactory]] instance to add
     */
    public addCommandFactory(commandFactory: CommandFactory): void {
        this.commandFactories.push(commandFactory);

        // TODO: find config and add to context

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
    public addServiceFactory(serviceFactory: ServiceFactory): void {
        this.serviceFactories.push(serviceFactory);

        // TODO: find config and add to context

        // TODO: initialise service with config

        for (const service of serviceFactory.getServices()) {
            this.context.addService(service);
        }
    }
}
