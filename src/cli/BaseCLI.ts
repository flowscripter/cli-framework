/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import debug from 'debug';
import CLI from '../api/CLI';
import DefaultRunner from '../runtime/DefaultRunner';
import DefaultContext from '../runtime/DefaultContext';
import CLIConfig from '../api/CLIConfig';
import Context from '../api/Context';
import Runner, { RunResult } from '../api/Runner';
import DefaultParser from '../runtime/parser/DefaultParser';
import DefaultServiceRegistry from '../runtime/DefaultServiceRegistry';
import DefaultCommandRegistry from '../runtime/DefaultCommandRegistry';
import Command, { CommandArgs } from '../api/Command';
import Service from '../api/Service';

/**
 * Base implementation of a [[CLI]].
 */
export default class BaseCLI implements CLI {

    protected readonly log: debug.Debugger = debug('BaseCLI');

    /**
     * [[ServiceRegistry]] to be made available in the [[Context]] when [[execute]] is invoked.
     */
    protected readonly serviceRegistry = new DefaultServiceRegistry();

    /**
     * [[CommandRegistry]] to be made available in the [[Context]] when [[execute]] is invoked.
     */
    protected readonly commandRegistry = new DefaultCommandRegistry();

    /**
     * [[CLIConfig]] to be made available in the [[Context]] when [[execute]] is invoked.
     */
    public readonly cliConfig: CLIConfig;

    /**
     * [[Service]] configurations to be made available in the [[Context]] when [[execute]] is invoked.
     */
    public readonly serviceConfigs: Map<string, any>;

    /**
     * [[Command]] configurations to be made available in the [[Context]] when [[execute]] is invoked.
     */
    public readonly commandConfigs: Map<string, CommandArgs>;

    /**
     * Optional command to be run if none are parsed from the arguments.
     */
    public readonly defaultCommand?: Command;

    /**
     * Optional command to be run if there is an error parsing the arguments.
     */
    public readonly usageCommand?: Command;

    /**
     * Constructor
     *
     * @param cliConfig a CLI configuration object which will be made available in the [[Context]].
     * @param services an array of [[Service]] implementations to be added to the CLI.
     * @param commands an array of [[Command]] implementations to be added to the CLI.
     * @param serviceConfigs a [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs a [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     * @param defaultCommand an optional command to be run if none are parsed from the arguments.
     * @param usageCommand an optional command to be run if there is an error parsing the arguments.
     *
     * @throws *Error* if there is an error registering a [[Command]] or [[Service]] instance.
     */
    public constructor(cliConfig: CLIConfig,
        services: Service[], commands: Command[],
        serviceConfigs: Map<string, any>, commandConfigs: Map<string, CommandArgs>,
        defaultCommand?: Command, usageCommand?: Command) {

        this.cliConfig = cliConfig;
        this.defaultCommand = defaultCommand;
        this.usageCommand = usageCommand;
        this.serviceConfigs = serviceConfigs;
        this.commandConfigs = commandConfigs;

        if (!_.isUndefined(services)) {
            services.forEach((service) => {
                this.serviceRegistry.addService(service);
            });
        }
        if (!_.isUndefined(commands)) {
            commands.forEach((command) => {
                this.commandRegistry.addCommand(command);
            });
        }
    }

    /**
     * @inheritdoc
     *
     * Creates a context, initialises all [[Service]] instances and invokes a [[Runner]].
     *
     * @throws *Error* if there is an error in the CLI framework when invoking the [[DefaultRunner]] implementation.
     */
    public async execute(args: string[]): Promise<RunResult> {

        this.log(`Executing with args: ${args}`);

        // create the context
        const context: Context = new DefaultContext(this.cliConfig, this.serviceRegistry, this.commandRegistry,
            this.serviceConfigs, this.commandConfigs);

        // initialise the services
        for (const service of this.serviceRegistry.getServices()) {
            this.log(`Initialising service: ${service.id}`);
            // eslint-disable-next-line no-await-in-loop
            await service.init(context);
        }

        const runner: Runner = new DefaultRunner(new DefaultParser());
        const runResult = await runner.run(args, context, this.defaultCommand);
        if (runResult === RunResult.ParseError) {
            if (!_.isUndefined(this.usageCommand)) {
                await this.usageCommand.run({}, context);
            }
        }
        return runResult;
    }
}
