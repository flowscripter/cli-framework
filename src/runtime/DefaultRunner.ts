/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import Runner from '../api/Runner';
import Command, { CommandArgs } from '../api/Command';
import Context from '../api/Context';
import Parser, { CommandClause, ParseResult, ScanResult } from './parser/Parser';
import DefaultParser from './parser/DefaultParser';
import validateCommand from './CommandValidation';

/**
 * Default implementation of a [[Runner]].
 */
export default class DefaultRunner implements Runner {

    private readonly log: debug.Debugger = debug('DefaultRunner');

    private readonly parser: Parser;

    private readonly commands: Command[] = [];

    private defaultCommand: Command | undefined;

    private commandsByNamesAndAliases: Map<string, Command> = new Map();

    private optionNamesAndAliases: string[] = [];

    /**
     * Constructor configures the instance using the optionally specified [[Parser]] instance.
     *
     * @param parser optional [[PluginRepository]] implementation. Defaults to using [[DefaultParser]].
     * available in the [[Context]] provided when invoking [[run]]
     */
    public constructor(parser?: Parser) {

        this.parser = parser || new DefaultParser();
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
    public addCommand(command: Command): void {

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getConfigForCommand(commandName: string, context: Context): CommandArgs | undefined {
        const config = context.commandConfigs.get(commandName);
        if (config) {
            this.log(`Found config: ${JSON.stringify(config)} for command: ${commandName}`);
        } else {
            this.log(`No config found for command: ${commandName}`);
        }
        return config;
    }

    /**
     * Attempt to discover and parse a non-global [[Command]] clause
     *
     * @throws *Error* if:
     * * there is a parsing error
     */
    private getNonGlobalParseResult(nonQualifierClauses: CommandClause[],
        potentialDefaultClauses: CommandClause[], overallUnusedArgs: string[], context: Context):
        ParseResult | undefined {

        let parseResult;

        // look for a default if we don't have a non-qualifier command
        if (nonQualifierClauses.length === 0) {
            this.log('No command specified, looking for a potential default in potential clauses');
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];
                // check if default was already found
                if (parseResult) {
                    overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                } else {
                    const config = this.getConfigForCommand(potentialCommandClause.command.name, context);
                    const potentialDefaultParseResult = this.parser.parseCommandClause(potentialCommandClause, config);
                    // ignore if there are parse errors
                    if (potentialDefaultParseResult.invalidArgs.length > 0) {
                        overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                    } else {
                        parseResult = potentialDefaultParseResult;
                    }
                }
            }
            if (this.defaultCommand) {
                this.log('No default command discovered, attempting to parse with config only');
                if (parseResult === undefined) {
                    const potentialCommandClause: CommandClause = {
                        command: this.defaultCommand,
                        potentialArgs: []
                    };
                    const config = this.getConfigForCommand(potentialCommandClause.command.name, context);
                    const potentialDefaultParseResult = this.parser.parseCommandClause(potentialCommandClause, config);
                    // ignore if there are parse errors
                    if (potentialDefaultParseResult.invalidArgs.length > 0) {
                        overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                    } else {
                        parseResult = potentialDefaultParseResult;
                    }
                }
            }
        } else {
            const commandClause = nonQualifierClauses[0];
            const config = this.getConfigForCommand(commandClause.command.name, context);
            parseResult = this.parser.parseCommandClause(commandClause, config);
            // fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                throw new Error(`There were parsing errors for command: ${parseResult.command.name} `
                    + `and args: ${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`);
            }
            overallUnusedArgs.push(...parseResult.unusedArgs);
        }
        return parseResult;
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if:
     * * more than one [[Command]] is specified
     * * no [[Command]] is specified and no default is specified or parsed
     * * there is a parsing error
     * * there are unused arguments
     */
    public async run(args: string[], context: Context): Promise<void> {

        // setup parser
        this.parser.setCommands(this.commands);

        // scan for command clauses
        const scanResult: ScanResult = this.parser.scanForCommandClauses(args);

        this.log(`clauses: ${scanResult.commandClauses.length}, unused args: ${scanResult.unusedLeadingArgs}`);

        // extracted clauses
        const qualifierClauses: CommandClause[] = [];
        const nonQualifierClauses: CommandClause[] = [];
        const potentialDefaultClauses: CommandClause[] = [];

        scanResult.commandClauses.forEach((commandClause) => {
            if (commandClause.command.isGlobal && commandClause.command.isGlobalQualifier) {
                qualifierClauses.push(commandClause);
            } else {
                nonQualifierClauses.push(commandClause);
            }
        });

        // check now for more than one non-qualifier command
        if (nonQualifierClauses.length > 1) {
            throw new Error('More than one command specified!');
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

        // parse global qualifiers args
        const parseResults: ParseResult[] = [];
        for (let i = 0; i < qualifierClauses.length; i += 1) {

            const currentClause = qualifierClauses[i];
            const commandName = currentClause.command.name;
            const config = this.getConfigForCommand(commandName, context);
            const parseResult = this.parser.parseCommandClause(currentClause, config);

            // fast fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                throw new Error(`Parse error for global qualifier command: ${parseResult.command.name} and args: `
                    + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`);
            }
            const { unusedArgs } = parseResult;

            // if no command found yet, and a default is specified, store as potential default clause
            if ((nonQualifierClauses.length === 0) && (this.defaultCommand) && (unusedArgs.length > 0)) {
                potentialDefaultClauses.push({
                    command: this.defaultCommand,
                    potentialArgs: unusedArgs
                });
            } else {
                overallUnusedArgs.push(...unusedArgs);
            }

            parseResults.push(parseResult);
        }

        const parseResult = this.getNonGlobalParseResult(nonQualifierClauses, potentialDefaultClauses,
            overallUnusedArgs, context);

        if (!parseResult) {
            throw new Error('No command specified and no default discovered!');
        }

        if (parseResult.invalidArgs.length > 0) {
            throw new Error(`Parse error for command: ${parseResult.command.name} and args: `
                + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`);
        }

        // error on unused args
        if (overallUnusedArgs.length > 0) {
            throw new Error(`Unused args: ${overallUnusedArgs.join(' ')}`);
        }

        // run the global qualifiers
        const promises: Promise<void>[] = [];

        parseResults.forEach((currentParseResult) => {
            const { command, commandArgs } = currentParseResult;
            const message = `global qualifier command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            promises.push(command.run(commandArgs, context).catch((err) => {
                throw new Error(`Error running ${message}: ${err.message}`);
            }));
        });
        await Promise.all(promises);

        const { command, commandArgs } = parseResult;

        const message = `command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
        this.log(`Running ${message}`);
        try {
            await command.run(commandArgs, context);
        } catch (err) {
            throw new Error(`Error running ${message}: ${err.message}`);
        }
    }
}
