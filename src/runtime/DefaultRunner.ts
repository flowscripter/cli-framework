/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import debug from 'debug';
import Runner from '../api/Runner';
import Context from '../api/Context';
import Parser, { CommandClause, ParseResult, ScanResult } from '../api/Parser';
import { isGlobalCommand, isGlobalModifierCommand, isSubCommand } from '../api/CommandTypeGuards';
import Command from '../api/Command';
import validateCommand from './CommandValidation';
import GlobalModifierCommand from '../api/GlobalModifierCommand';

/**
 * Default implementation of a [[Runner]].
 */
export default class DefaultRunner implements Runner {

    private readonly log: debug.Debugger = debug('DefaultRunner');

    private readonly parser: Parser;

    private nonGlobalCommandsByName: Map<string, Command> = new Map();

    /**
     * Constructor configures the instance using the specified [[Parser]] instance and optional default [[Command]].
     *
     * @param parser [[Parser]] implementation.
     */
    public constructor(parser: Parser) {
        this.parser = parser;
    }

    /**
     * Validate specified command against all others validated so far.
     *
     * @throws *Error* if the [[Command]] is not a [[GlobalCommand]] and its name duplicates an already validated
     * [[Command]] name.
     */
    private validateWithOtherCommands(command: Command): void {

        // check for non-global command name duplicate
        if (!isGlobalCommand(command)) {
            if (this.nonGlobalCommandsByName.has(command.name)) {
                throw new Error(`Command name: ${command.name} duplicates the name of an existing command`);
            }
        }

        // store command by name for future validation against new commands
        this.nonGlobalCommandsByName.set(command.name, command);
    }

    /**
     * Attempt to successfully parse a non-modifier [[Command]] clause from the potential
     * non-modifier and default clauses provided.
     *
     * @param nonModifierClauses potential non-modifier [[CommandClause]] instances.
     * @param potentialDefaultClauses potential default [[CommandClause]] instances.
     * @param overallUnusedArgs current list of unused args. This will be appended to during this parsing operation.
     * @param context the [[Context]] for the CLI invocation.
     * @param defaultCommand optional [[Command]] implementation.
     * @return a [[ParseResult]] for a successfully parsed [[CommandClause]], a *string* if a parse error occurred
     * or *undefined* if no clause was parsed.
     * @throws *Error* if there is a parsing error
     */
    private getNonModifierParseResult(nonModifierClauses: CommandClause[], potentialDefaultClauses: CommandClause[],
        overallUnusedArgs: string[], context: Context, defaultCommand?: Command): ParseResult | string | undefined {

        let parseResult;

        // look for a default if we don't have a non-modifier command
        if (nonModifierClauses.length === 0) {
            this.log('No command specified, looking for a potential default in potential clauses');
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];
                // check if default was already found
                if (parseResult) {
                    overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                } else {
                    const config = context.commandConfigs.get(potentialCommandClause.command.name);
                    const potentialDefaultParseResult = this.parser.parseCommandClause(potentialCommandClause, config);

                    // ignore if there are parse errors
                    if (potentialDefaultParseResult.invalidArgs.length > 0) {
                        overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                    } else {
                        parseResult = potentialDefaultParseResult;
                    }
                }
            }
            if (defaultCommand) {
                this.log('No default command discovered, attempting to parse with config only');
                if (parseResult === undefined) {
                    const potentialCommandClause: CommandClause = {
                        command: defaultCommand,
                        potentialArgs: []
                    };
                    const config = context.commandConfigs.get(potentialCommandClause.command.name);
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
            const commandClause = nonModifierClauses[0];
            const config = context.commandConfigs.get(commandClause.command.name);
            parseResult = this.parser.parseCommandClause(commandClause, config);

            // fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                return `There were parsing errors for command: ${parseResult.command.name} `
                    + `and args: ${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`;
            }
            overallUnusedArgs.push(...parseResult.unusedArgs);
        }
        return parseResult;
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if:
     *
     * * the provided [[Command]] instances are not valid
     * * a default command is specified and it is not a [[SubCommand]] or [[GlobalCommand]]
     * * there is an error caused by the CLI framework implementation
     */
    public async run(args: string[], context: Context, commands: Command[], defaultCommand?: Command):
        Promise<string | undefined> {

        if (defaultCommand && !isGlobalCommand(defaultCommand) && !isSubCommand(defaultCommand)) {
            throw new Error(`Default command: ${defaultCommand.name} is not a global command or sub-command`);
        }

        let failureMessage;

        // validate each command itself and against each other
        this.nonGlobalCommandsByName = new Map<string, Command>();

        commands.forEach((command) => {
            validateCommand(command);
            this.validateWithOtherCommands(command);
        });

        // validate default command if specified
        if (defaultCommand) {
            validateCommand(defaultCommand);
        }

        // provide the commands to the parser
        this.parser.setCommands(commands);

        // scan for command clauses
        const scanResult: ScanResult = this.parser.scanForCommandClauses(args);

        this.log(`clauses: ${scanResult.commandClauses.length}, unused args: ${scanResult.unusedLeadingArgs}`);

        // categorise the clauses
        const modifierClauses: CommandClause[] = [];
        const nonModifierClauses: CommandClause[] = [];

        scanResult.commandClauses.forEach((commandClause) => {
            if (isGlobalCommand(commandClause.command)) {
                commandClause.potentialArgs.unshift(`--${commandClause.command.name}`);
                nonModifierClauses.push(commandClause);
            } else if (isGlobalModifierCommand(commandClause.command)) {
                commandClause.potentialArgs.unshift(`--${commandClause.command.name}`);
                modifierClauses.push(commandClause);
            } else {
                nonModifierClauses.push(commandClause);
            }
        });

        // check if more than one non-modifier command has been specified
        if (nonModifierClauses.length > 1) {
            return 'More than one command specified: '
                + `${nonModifierClauses.map((clause) => clause.command.name).join(', ')}`;
        }

        // sort the global modifier clauses in order of run priority
        modifierClauses.sort((a, b): number => {
            const commandA = a.command as GlobalModifierCommand;
            const commandB = b.command as GlobalModifierCommand;
            return (commandA.runPriority < commandB.runPriority) ? 1 : -1;
        });

        // store an overall list of unused args
        const overallUnusedArgs: string[] = [];

        // if no command found yet, and a default is specified, create a potential default clause using args
        // which weren't used in clauses so far
        const potentialDefaultClauses: CommandClause[] = [];
        if (defaultCommand) {
            potentialDefaultClauses.push({
                command: defaultCommand,
                potentialArgs: scanResult.unusedLeadingArgs
            });
        } else {
            overallUnusedArgs.push(...scanResult.unusedLeadingArgs);
        }

        // parse global modifiers args
        for (let i = 0; i < modifierClauses.length; i += 1) {

            const modifierClause = modifierClauses[i];

            // get config for command in current clause and use when parsing clause
            const config = context.commandConfigs.get(modifierClause.command.name);
            const parseResult = this.parser.parseCommandClause(modifierClause, config);

            // fast fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                return `Parse error for global modifier command: ${parseResult.command.name} and args: `
                    + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`;
            }
            const { unusedArgs } = parseResult;

            // if no command found yet, and a default is specified, store as potential default clause
            if ((nonModifierClauses.length === 0) && defaultCommand) {
                potentialDefaultClauses.push({
                    command: defaultCommand,
                    potentialArgs: unusedArgs
                });
            } else {
                overallUnusedArgs.push(...unusedArgs);
            }

            // run the successfully parsed global modifier
            const { command, commandArgs } = parseResult;
            const message = `global modifier command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            try {
                // eslint-disable-next-line no-await-in-loop
                await command.run(commandArgs, context);
            } catch (err) {
                return `Error running ${message}: ${err.message}`;
            }
        }

        // perform final determination of non-modifier clause to run
        const parseResult = this.getNonModifierParseResult(nonModifierClauses, potentialDefaultClauses,
            overallUnusedArgs, context, defaultCommand);

        if (!parseResult) {
            return 'No command specified and no default discovered!';
        }
        if (_.isString(parseResult)) {
            return parseResult;
        }
        if (parseResult.invalidArgs.length > 0) {
            return `Parse error for command: ${parseResult.command.name} and args: `
                + `${parseResult.invalidArgs.map((arg) => arg.name).join(', ')}`;
        }

        // error on unused args
        overallUnusedArgs.push(...parseResult.unusedArgs);
        if (overallUnusedArgs.length > 0) {
            return `Unused args: ${overallUnusedArgs.join(' ')}`;
        }

        const { groupCommand, command, commandArgs } = parseResult;

        let message;
        try {
            if (groupCommand) {
                message = `command: ${groupCommand.name}`;
                this.log(`Running ${message}`);
                await groupCommand.run({}, context);
            }
            message = `command: ${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            await command.run(commandArgs, context);
        } catch (err) {
            failureMessage = `Error running ${message}: ${err.message}`;
            this.log(failureMessage);
        }

        return failureMessage;
    }
}
