/** global process */

/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any,max-classes-per-file */

import debug from 'debug';
import Command, { CommandArgs } from '../api/Command';
import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import {
    HelpGlobalCommand,
    HelpSubCommand,
    StderrPrinterService,
    StdoutPrinterService
} from '..';
import CommandFactory from '../api/CommandFactory';
import AbstractNodeCLI, { packageInfo } from './AbstractNodeCLI';

/**
 * Provides a minimal set of services.
 */
class SimpleServiceFactory implements ServiceFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [
            new StdoutPrinterService(80),
            new StderrPrinterService(80)
        ];
    }
}

/**
 * Provides a minimal set of commands.
 */
class SimpleCommandFactory implements CommandFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [
            new HelpSubCommand(),
            new HelpGlobalCommand(),
        ];
    }
}

/**
 * Node command line process implementation of a [[CLI]] with basic functionality.
 */
export default class SimpleNodeCLI extends AbstractNodeCLI {

    protected readonly log: debug.Debugger = debug('SimpleNodeCLI');

    /**
     * Constructor taking an optional name.
     *
     * A [[CLIConfig]] will be created with the following properties:
     *
     * * `name`: taken from the `package.json` file if the optional name is not specified.
     * * `description`: taken from the `package.json` file.
     * * `version`: taken from the `package.json` file.
     * * `stdin`: `process.stdin`.
     * * `stdout`: `process.stdout`.
     * * `stderr`: `process.stderr`.
     *
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     * @param serviceConfigs an optional [[Service]] configuration map where the keys are [[Service.id]] values and
     * the values are generic configuration objects.
     * @param commandConfigs an optional [[Command]] configuration map where the keys are [[Command.name]] values and
     * the values are in the form of [[CommandArgs]].
     */
    public constructor(name?: string, serviceConfigs?: Map<string, any>, commandConfigs?: Map<string, CommandArgs>) {
        super({
            name: name || packageInfo.name,
            description: packageInfo.description,
            version: packageInfo.version,
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        }, serviceConfigs, commandConfigs, [new SimpleServiceFactory()], [new SimpleCommandFactory()]);
    }
}
