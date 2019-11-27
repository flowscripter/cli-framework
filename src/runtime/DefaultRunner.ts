/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import Runner from '../api/Runner';
import Command from '../api/Command';
import Context from '../api/Context';
import Parser, { CommandClause, ParseResult, ScanResult } from './parser/Parser';
import DefaultParser from './parser/DefaultParser';
import validateCommand from './CommandValidation';
import { Icon, PrinterService } from '../core/service/PrinterService';

/**
 * Default implementation of a [[Runner]].
 */
export default class DefaultRunner<S_ID> implements Runner<S_ID> {

    private readonly log: debug.Debugger = debug('DefaultRunner');

    private readonly printerServiceId: S_ID;

    private readonly parser: Parser<S_ID>;

    private readonly commands: Command<S_ID>[] = [];

    private defaultCommand: Command<S_ID> | undefined;

    private commandsByNamesAndAliases: Map<string, Command<S_ID>> = new Map();

    private optionNamesAndAliases: string[] = [];

    /**
     * Constructor configures the instance using the optionally specified [[Parser]] instance.
     *
     * @param parser optional [[PluginRepository]] implementation. Defaults to using [[DefaultParser]].
     * @param printerServiceId ID of a [[PrinterService]] implementation which is expected to be
     * available in the [[Context]] provided when invoking [[run]]
     */
    public constructor(printerServiceId: S_ID, parser?: Parser<S_ID>) {

        this.printerServiceId = printerServiceId;
        this.parser = parser || new DefaultParser<S_ID>();
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if a [[Command]] is added where:
     * * the [[Argument]] definitions for the [[Command]] are not valid
     * * [[Command.name]] or [[Command.aliases]] matches those of an existing command.
     * * [[Command.isDefault]] is `true` and there is an existing default.
     * * [[Command.isGlobal]] is `true` and [[Command.name]] or [[Command.aliases]] matches an existing command's
     * [[Option.name]].
     * * one of the command's [[Option.name]] matches an existing global [[Command.name]] or [[Command.aliases]]
     * * [[Command.isGlobal]] is `true` and [[Command.isGlobalQualifier]] is `false` and there is already a similarly
     * configured command.
     */
    public addCommand(command: Command<S_ID>): void {

        validateCommand(command);

        // check if isDefault and default already set
        if (command.isDefault && this.defaultCommand) {
            throw new Error(`Command: ${command.name} is default and there is already an existing default command: ${
                this.defaultCommand.name}`);
        }

        // check for name or alias duplicate
        if (this.commandsByNamesAndAliases.has(command.name)) {
            throw new Error(`Command name: ${command.name} duplicates the name or alias of an existing command`);
        }
        if (command.aliases) {
            command.aliases.forEach((alias) => {
                if (this.commandsByNamesAndAliases.has(alias)) {
                    throw new Error(`Command alias: ${alias} duplicates the name or alias of an existing command`);
                }
            });
            command.aliases.forEach((alias) => this.commandsByNamesAndAliases.set(alias, command));
        }

        // check if global/qualifier command name or aliases duplicates existing option name or shortAlias
        if (command.isGlobal) {
            let duplicate = false;

            if (command.aliases) {
                command.aliases.forEach((alias) => {
                    if (this.optionNamesAndAliases.includes(alias)) {
                        duplicate = true;
                    }
                });
            }
            if (duplicate || this.optionNamesAndAliases.includes(command.name)) {
                throw new Error(`Global or global qualifier command name: ${command.name
                } or aliases duplicates the name or alias of an existing command's options name or short alias`);
            }
        }
        this.commands.push(command);

        // retain reference to default command
        if (command.isDefault) {
            this.defaultCommand = command;
        }

        // store command by name and aliases for future validation against new commands
        this.commandsByNamesAndAliases.set(command.name, command);
        if (command.aliases) {
            command.aliases.forEach((alias) => this.commandsByNamesAndAliases.set(alias, command));
        }

        // store option names and aliases for future validation against new commands
        if (command.options) {
            command.options.forEach((option) => {
                this.optionNamesAndAliases.push(option.name);
                if (option.shortAlias) {
                    this.optionNamesAndAliases.push(option.shortAlias);
                }
            });
        }
    }

    private getNonGlobalParseResult(nonQualifierClauses: CommandClause<S_ID>[],
        potentialDefaultClauses: CommandClause<S_ID>[], overallUnusedArgs: string[], printerService: PrinterService):
        ParseResult<S_ID> | undefined {

        let parseResult;

        // look for a default if we don't have a non-qualifier command
        if (nonQualifierClauses.length === 0) {
            this.log('No command specified, looking for a potential default');
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];
                // check if default was already found
                if (parseResult) {
                    overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                } else {
                    // TODO: pass in config defaults
                    const potentialDefaultParseResult = this.parser.parseCommandClause(potentialCommandClause);
                    // ignore if there are parse errors
                    if (potentialDefaultParseResult.invalidArgs.length > 0) {
                        overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                    } else {
                        parseResult = potentialDefaultParseResult;
                    }
                }
            }
        } else {
            // TODO: pass in config defaults
            parseResult = this.parser.parseCommandClause(nonQualifierClauses[0]);
            // fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                printerService.error(`There were parsing errors for command: ${parseResult.command.name} `
                    + `and args: ${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`, Icon.FAILURE);
                return parseResult;
            }
            overallUnusedArgs.push(...parseResult.unusedArgs);
        }
        return parseResult;
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if:
     * * the provided [[Context]] does not include a [[PrinterService]] implementation
     * specified by [[printerServiceId]].
     * * more than one [[Command]] is specified
     * * no [[Command]] is specified
     * * there is a parsing error
     */
    public async run(args: string[], context: Context<S_ID>): Promise<void> {

        // check if printer service provided
        const printerService = context.getService(this.printerServiceId) as unknown as (PrinterService | null);
        if (printerService === null) {
            throw new Error(`PrinterService with ID: ${this.printerServiceId} was not found in context!`);
        }

        // setup parser
        this.parser.setCommands(this.commands);

        // scan for command clauses
        const scanResult: ScanResult<S_ID> = this.parser.scanForCommandClauses(args);

        this.log(`clauses: ${scanResult.commandClauses.length}, unused args: ${scanResult.unusedLeadingArgs}`);

        // extracted clauses
        const qualifierClauses: CommandClause<S_ID>[] = [];
        const nonQualifierClauses: CommandClause<S_ID>[] = [];
        const potentialDefaultClauses: CommandClause<S_ID>[] = [];

        scanResult.commandClauses.forEach((commandClause) => {
            if (commandClause.command.isGlobal && commandClause.command.isGlobalQualifier) {
                qualifierClauses.push(commandClause);
            } else {
                nonQualifierClauses.push(commandClause);
            }
        });

        // check now for more than one non-qualifier command
        if (nonQualifierClauses.length > 1) {
            const message = 'More than one command specified!';
            printerService.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        // store an overall list of unused args
        const overallUnusedArgs: string[] = [];

        // if no command found yet, and a default is specified, store as potential default clause
        if ((nonQualifierClauses.length === 0) && (this.defaultCommand) && (scanResult.unusedLeadingArgs.length > 0)) {
            potentialDefaultClauses.push({
                command: this.defaultCommand,
                potentialArgs: scanResult.unusedLeadingArgs
            });
        } else {
            overallUnusedArgs.push(...scanResult.unusedLeadingArgs);
        }

        // parse global qualifiers args and run
        const promises: Promise<void>[] = [];
        for (let i = 0; i < qualifierClauses.length; i += 1) {
            // TODO: pass in config defaults
            const parseResult = this.parser.parseCommandClause(qualifierClauses[i]);

            // fast fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                const message = 'Parse error for global qualifier command: '
                    + `${parseResult.command.name} and args: `
                    + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`;
                printerService.error(message, Icon.FAILURE);
                throw new Error(message);
            }
            const { command, commandArgs, unusedArgs } = parseResult;

            // if no command found yet, and a default is specified, store as potential default clause
            if ((nonQualifierClauses.length === 0) && (this.defaultCommand) && (unusedArgs.length > 0)) {
                potentialDefaultClauses.push({
                    command: this.defaultCommand,
                    potentialArgs: unusedArgs
                });
            } else {
                overallUnusedArgs.push(...unusedArgs);
            }

            const message = `global qualifier command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            promises.push(command.run(commandArgs, context).catch((err) => {
                printerService.error(`Error running ${message}: ${err.message}`, Icon.FAILURE);
                throw err;
            }));
        }
        await Promise.all(promises);

        const parseResult = this.getNonGlobalParseResult(nonQualifierClauses, potentialDefaultClauses,
            overallUnusedArgs, printerService);

        if (!parseResult) {
            const message = 'No command specified and no default discovered!';
            printerService.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        if (parseResult.invalidArgs.length > 0) {
            const message = 'Parse error for command: '
                + `${parseResult.command.name} and args: `
                + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`;
            printerService.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        // warn on global unused args
        if (overallUnusedArgs.length > 0) {
            printerService.warn(`Unused args: ${overallUnusedArgs.join(' ')}`, Icon.ALERT);
        }

        const { command, commandArgs } = parseResult;

        const message = `command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
        this.log(`Running ${message}`);
        try {
            await command.run(commandArgs, context);
        } catch (err) {
            printerService.error(`Error running ${message}: ${err.message}`, Icon.FAILURE);
            throw err;
        }
    }
}
