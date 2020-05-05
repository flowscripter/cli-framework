/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import debug from 'debug';
import CLI from '../api/CLI';
import CommandFactory from '../api/CommandFactory';
import ServiceFactory from '../api/ServiceFactory';
import CoreCommandFactory from '../core/CoreCommandFactory';
import CoreServiceFactory from '../core/CoreServiceFactory';
import DefaultRunner from '../runtime/DefaultRunner';
import DefaultContext from '../runtime/DefaultContext';
import CLIConfig from '../api/CLIConfig';
import Context from '../api/Context';
import Runner, { RunResult } from '../api/Runner';
import DefaultParser from '../runtime/parser/DefaultParser';
import DefaultServiceRegistry from '../runtime/DefaultServiceRegistry';
import DefaultCommandRegistry from '../runtime/DefaultCommandRegistry';
import { CommandArgs } from '..';
import PluginServiceFactory from '../plugin/PluginServiceFactory';
import PluginCommandFactory from '../plugin/PluginCommandFactory';

/**
 * Base implementation of a [[CLI]].
 *
 * [[CoreServiceFactory]] and [[CoreCommandFactory]] are added by default.
 */
export default class BaseCLI implements CLI {

    protected readonly log: debug.Debugger = debug('BaseCLI');

    private readonly cliConfig: CLIConfig;

    private readonly coreServiceFactory: CoreServiceFactory;

    private readonly coreCommandFactory: CoreCommandFactory;

    public readonly commandFactories: CommandFactory[] = [];

    public readonly serviceFactories: ServiceFactory[] = [];

    private readonly serviceConfigs: Map<string, any>;

    private readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * Constructor which adds the following factories by default: [[CoreServiceFactory]] and [[CoreCommandFactory]]
     *
     * If a [[PluginManagerConfig]] is defined in the provided [[CLIConfig]] a [[PluginServiceFactory]] and
     * [[PluginCommandFactory]] are also added.
     *
     * @param cliConfig a CLI configuration object which will be made available in the [[Context]].
     * @param serviceConfigs an optional [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs an optional [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     */
    public constructor(cliConfig: CLIConfig, serviceConfigs?: Map<string, any>,
        commandConfigs?: Map<string, CommandArgs>) {

        this.cliConfig = cliConfig;

        this.coreServiceFactory = new CoreServiceFactory();
        this.coreCommandFactory = new CoreCommandFactory();

        this.serviceConfigs = serviceConfigs || new Map<string, any>();
        this.commandConfigs = commandConfigs || new Map<string, CommandArgs>();

        this.addServiceFactory(this.coreServiceFactory);
        this.addCommandFactory(this.coreCommandFactory);

        if (!_.isUndefined(cliConfig.pluginManagerConfig)) {
            this.addServiceFactory(new PluginServiceFactory());
            this.addCommandFactory(new PluginCommandFactory());
        }
    }

    /**
     * @inheritdoc
     *
     * If a parsing error occurs, general CLI usage will be displayed via the
     * [[UsageCommand]] provided by the [[CoreCommandFactory]].
     *
     * The [[UsageCommand]] is also provided to the [[DefaultRunner]] implementation as the default command.
     *
     * @throws *Error* if there is an error:
     * * when registering [[Command]] and [[Service]] instances.
     * * in the CLI framework when invoking the [[DefaultRunner]] implementation.
     */
    public async execute(args: string[]): Promise<RunResult> {

        this.log(`executing with args: ${args}`);

        const serviceRegistry = new DefaultServiceRegistry();
        for (const serviceFactory of this.serviceFactories) {
            for (const service of serviceFactory.getServices()) {
                serviceRegistry.addService(service);
            }
        }

        const commandRegistry = new DefaultCommandRegistry();
        for (const commandFactory of this.commandFactories) {
            for (const command of commandFactory.getCommands()) {
                commandRegistry.addCommand(command);
            }
        }

        // create the context
        const context: Context = new DefaultContext(this.cliConfig, serviceRegistry, commandRegistry,
            this.serviceConfigs, this.commandConfigs);

        // initialise the services
        for (const service of serviceRegistry.getServices()) {
            this.log(`Initialising service: ${service.id}`);
            // eslint-disable-next-line no-await-in-loop
            await service.init(context);
        }

        // pass the usage command as the default command
        const runner: Runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(args, context, this.coreCommandFactory.usageCommand);
        if (runResult === RunResult.ParseError) {

            // display usage information
            await this.coreCommandFactory.usageCommand.run({}, context);
        }
        return runResult;
    }

    /**
     * Add a [[CommandFactory]] to the [[CLI]].
     *
     * All [[Command]] instances provided by the [[CommandFactory]] will be added to the [[Runner]].
     *
     * Note that this implementation adds [[CoreCommandFactory]] by default.
     *
     * @param commandFactory the [[CommandFactory]] instance to add
     */
    public addCommandFactory(commandFactory: CommandFactory): void {
        this.commandFactories.push(commandFactory);
    }

    /**
     * Add a [[ServiceFactory]] to the list of those which will be used to make available
     * in the [[Context]] the next time [[execute]] is invoked.
     *
     * Note that this implementation adds [[CoreServiceFactory]] by default.
     *
     * @param serviceFactory the [[ServiceFactory]] instance to add
     */
    public addServiceFactory(serviceFactory: ServiceFactory): void {
        this.serviceFactories.push(serviceFactory);
    }
}
