/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import { Writable } from 'stream';
import CLI from '../api/CLI';
import CommandFactory from '../api/CommandFactory';
import ServiceFactory from '../api/ServiceFactory';
import DefaultRunner from '../runtime/DefaultRunner';
import DefaultContext from '../runtime/DefaultContext';
import CoreCommandFactory from '../core/CoreCommandFactory';
import CoreServiceFactory from '../core/CoreServiceFactory';

/**
 * Base implementation of a [[CLI]]. Requires provision of a [[Writeable]] stream for user output via
 * a [[PrinterService]] implementation and a configuration map.
 *
 * Adds by default [[CoreServiceFactory]] and [[CoreCommandFactory]].
 */
export default class BaseCLI implements CLI {

    private readonly log: debug.Debugger = debug('BaseCLI');

    private readonly commandFactories: CommandFactory[] = [];

    private readonly serviceFactories: ServiceFactory[] = [];

    private context = new DefaultContext();

    private runner = new DefaultRunner();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly configuration: Map<string, any>;

    /**
     * Constructor prepares a [[PrinterService]] implementation using the provided [[Writable]]
     * and ensures all [[Service]] and [[Command]] instances are configured using the provided
     * configuration map.
     *
     * @param writable a [[Writable]] stream which will be provided to a [[PrinterService]] implementation.
     * @param configuration an optional map of configuration objects with the keys being either [[Service.id]] or
     * [[Command.name]] values. The values for [[Command]] configuration entries are expected to be in the form
     * of [[CommandArgs]].
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(writable: Writable, configuration: Map<string, any> = new Map()) {
        this.configuration = configuration;

        this.addServiceFactory(new CoreServiceFactory(writable));
        this.addCommandFactory(new CoreCommandFactory());
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if the provided args cannot be parsed of if there is an error running the specified
     * commands or invoking any services.
     */
    public async execute(args: string[]): Promise<void> {
        await this.runner.run(args, this.context);
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
     * Note that [[CoreCommandFactory]] is added by default in this implementation.
     *
     * @param commandFactory the [[CommandFactory]] instance to add
     */
    public addCommandFactory(commandFactory: CommandFactory): void {
        this.commandFactories.push(commandFactory);
        for (const command of commandFactory.getCommands()) {
            const config = this.configuration.get(command.name);
            if (config) {
                this.log(`Adding config: ${JSON.stringify(config)} for command: ${command.name}`);
                this.context.commandConfigs.set(command.name, config);
            } else {
                this.log(`No config found for command: ${command.name}`);
            }
            this.runner.addCommand(command);
        }
    }

    /**
     * Add a [[ServiceFactory]] to the list of those which will be used to make available
     * in the [[Context]] the next time [[execute]] is invoked.
     *
     * Note that [[CoreServiceFactory]] is added by default in this implementation.
     *
     * @param serviceFactory the [[ServiceFactory]] instance to add
     */
    public addServiceFactory(serviceFactory: ServiceFactory): void {
        this.serviceFactories.push(serviceFactory);

        for (const service of serviceFactory.getServices()) {
            const config = this.configuration.get(service.id);
            if (config) {
                this.log(`Adding config: ${JSON.stringify(config)} for service: ${service.id}`);
                this.context.serviceConfigs.set(service.id, config);
            } else {
                this.log(`No config found for service: ${service.id}`);
            }
            service.init(config);
            this.context.addService(service);
        }
    }
}
