/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import debug from 'debug';
import CLI from '../api/CLI';
import CommandFactory from '../api/CommandFactory';
import ServiceFactory from '../api/ServiceFactory';
import DefaultRunner from '../runtime/DefaultRunner';
import DefaultContext from '../runtime/DefaultContext';
import CoreCommandFactory from '../core/CoreCommandFactory';
import CoreServiceFactory from '../core/CoreServiceFactory';
import Service from '../api/Service';
import Command from '../api/Command';
import Context from '../api/Context';
import Runner from '../api/Runner';
import { Icon } from '../core/service/PrinterService';
import DefaultParser from '../runtime/parser/DefaultParser';

/**
 * Base implementation of a [[CLI]]. Requires provision of a CLI configuration with properties
 * for stdout and stderr [[Writeable]] streams and a CLI name and version.
 *
 * [[CoreServiceFactory]] and [[CoreCommandFactory]] are added by default.
 */
export default class BaseCLI implements CLI {

    protected readonly log: debug.Debugger = debug('BaseCLI');

    private readonly cliConfig: any = {};

    private readonly coreServiceFactory: CoreServiceFactory;

    private readonly coreCommandFactory: CoreCommandFactory;

    public readonly commandFactories: CommandFactory[] = [];

    public readonly serviceFactories: ServiceFactory[] = [];

    /**
     * Constructor which adds the following factories by default: [[CoreServiceFactory]] and [[CoreCommandFactory]]
     *
     * @param cliConfig a CLI configuration object which will be made available in the [[Context]]. It should have
     * the following required properties defined:
     * * `name` a string value for the CLI name which will be provided to [[Help]] and [[Usage]] [[Command]]
     * implementations.
     * * `description` a string value for a CLI description which will be provided to [[Help]] and [[Usage]] [[Command]]
     * implementations.
     * * `version` a string value for the CLI version which will be provided to a [[Version]] [[Command]]
     * implementation.
     * * *stdin* a Readable stream which will be provided to a [[Prompter]] [[Service]]
     * implementation.
     * * *stdout* a Writable stream which will be provided to a stdout [[Printer]] [[Service]]
     * implementation.
     * * *stderr* a Writable stream which will be provided to a stderr [[Printer]] [[Service]]
     * implementation.
     * * *serviceConfigs* a [[Service]] configuration map where the keys are [[Service.id]] values and the values are
     * generic configuration objects.
     * * *commandConfigs* a [[Command]] configuration map where the keys are [[Command.name]] values and the values are
     * in the form of [[CommandArgs]].
     * @throws *Error* if the required properties for the provided CLI config are not defined or the optional
     * properties are not of the correct type.
     */
    public constructor(cliConfig: any) {

        if (_.isUndefined(cliConfig.name) || !_.isString(cliConfig.name)) {
            throw new Error('Provided cliConfig is missing property: "name: string"');
        }
        if (_.isUndefined(cliConfig.description) || !_.isString(cliConfig.description)) {
            throw new Error('Provided cliConfig is missing property: "description: string"');
        }
        if (_.isUndefined(cliConfig.version) || !_.isString(cliConfig.version)) {
            throw new Error('Provided cliConfig is missing property: "version: string"');
        }
        if (_.isUndefined(cliConfig.stdin) || !_.isFunction(cliConfig.stdin.read)) {
            throw new Error('Provided cliConfig is missing property: "stdin: Readable"');
        }
        if (_.isUndefined(cliConfig.stdout) || !_.isFunction(cliConfig.stdout.write)) {
            throw new Error('Provided cliConfig is missing property: "stdout: Writable"');
        }
        if (_.isUndefined(cliConfig.stderr) || !_.isFunction(cliConfig.stderr.write)) {
            throw new Error('Provided cliConfig is missing property: "stderr: Writable"');
        }
        if (!_.isUndefined(cliConfig.serviceConfigs) && !_.isMap(cliConfig.serviceConfigs)) {
            throw new Error('cliConfig.commandConfigs should be a Map');
        }
        if (!_.isUndefined(cliConfig.commandConfigs) && !_.isMap(cliConfig.commandConfigs)) {
            throw new Error('cliConfig.commandConfigs should be a Map');
        }

        this.cliConfig = cliConfig;

        this.coreServiceFactory = new CoreServiceFactory(cliConfig.stdin, cliConfig.stdout, cliConfig.stderr);
        this.coreCommandFactory = new CoreCommandFactory(cliConfig.name, cliConfig.description, cliConfig.version);

        this.addServiceFactory(this.coreServiceFactory);
        this.addCommandFactory(this.coreCommandFactory);
    }

    /**
     * @inheritdoc
     *
     * Any error caused by user arguments when invoking the [[Runner]] will be caught and displayed as an error
     * message to the user via the [[StderrPrinterService]] provided by the [[CoreServiceFactory]]. General CLI
     * usage will then be displayed via the [[UsageCommand]] provided by the [[CoreCommandFactory]].
     *
     * The [[UsageCommand]] is also provided to the [[DefaultRunner]] implementation as the default command.
     *
     * @throws *Error* if there is an error in the CLI framework when invoking the [[DefaultRunner]] implementation.
     */
    public async execute(args: string[]): Promise<number> {

        this.log(`executing with args: ${args}`);

        const services: Service[] = [];
        const commands: Command[] = [];

        for (const serviceFactory of this.serviceFactories) {
            for (const service of serviceFactory.getServices()) {
                services.push(service);
            }
        }

        for (const commandFactory of this.commandFactories) {
            for (const command of commandFactory.getCommands()) {
                commands.push(command);
            }
        }

        if (_.isUndefined(this.cliConfig.serviceConfigs)) {
            this.cliConfig.serviceConfigs = new Map<string, any>();
        }
        if (_.isUndefined(this.cliConfig.commandConfigs)) {
            this.cliConfig.commandConfigs = new Map<string, any>();
        }

        // create the context
        const context: Context = new DefaultContext(this.cliConfig, services, commands, this.cliConfig.serviceConfigs,
            this.cliConfig.commandConfigs);

        // initialise the services
        for (const service of services.sort((a, b) => (a.initPriority >= b.initPriority ? 1 : 0))) {
            this.log(`Initialising service: ${service.id}`);
            service.init(context);
        }

        // pass the usage command as the default command
        const runner: Runner = new DefaultRunner(new DefaultParser());

        const failureResult = await runner.run(args, context, commands, this.coreCommandFactory.usageCommand);
        if (!_.isUndefined(failureResult)) {
            // output any unused args, parsing error or run error on stderr
            this.coreServiceFactory.stderrPrinterService.error(`${failureResult}\n`, Icon.FAILURE);

            // display usage information
            await this.coreCommandFactory.usageCommand.run({}, context);

            return 1;
        }
        return 0;
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
