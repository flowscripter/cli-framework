/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import debug from 'debug';
import Runner, { RunResult } from '../api/Runner';
import Context from '../api/Context';
import Parser, {
    CommandClause,
    InvalidArg,
    InvalidReason,
    ParseResult,
    ScanResult
} from '../api/Parser';
import {
    isGlobalCommand,
    isGlobalModifierCommand,
    isGroupCommand,
    isSubCommand
} from '../api/CommandTypeGuards';
import Command, { CommandArgs } from '../api/Command';
import validateCommand from './CommandValidation';
import GlobalModifierCommand from '../api/GlobalModifierCommand';
import Printer, { Icon, STDERR_PRINTER_SERVICE } from '../core/service/PrinterService';
import GroupCommand from '../api/GroupCommand';

/**
 * Default implementation of a [[Runner]].
 */
export default class DefaultRunner implements Runner {

    private readonly log: debug.Debugger = debug('DefaultRunner');

    private readonly parser: Parser;

    /**
     * Constructor configures the instance using the specified [[Parser]] instance and optional default [[Command]].
     *
     * @param parser [[Parser]] implementation.
     */
    public constructor(parser: Parser) {
        this.parser = parser;
    }

    private static getInvalidArgString(invalidArg: InvalidArg, skipArgName: boolean): string {
        let argString;
        if (!skipArgName && !_.isUndefined(invalidArg.name)) {
            argString = invalidArg.name;
            argString = `${argString}${_.isUndefined(invalidArg.value) ? '' : `=${invalidArg.value}`}`;
        } else {
            argString = _.isUndefined(invalidArg.value) ? '' : `${invalidArg.value}`;
        }
        let invalidString = '';
        // eslint-disable-next-line default-case
        switch (invalidArg.reason) {
        case InvalidReason.IllegalMultipleValues:
            invalidString = '(illegal multiple values)';
            break;
        case InvalidReason.IllegalValue:
            invalidString = '(illegal value)';
            break;
        case InvalidReason.IncorrectType:
            invalidString = '(incorrect type)';
            break;
        case InvalidReason.MissingValue:
            invalidString = '(missing value)';
            break;
        }
        if (argString.length > 0) {
            return `${argString} ${invalidString}`;
        }
        return invalidString;
    }

    private static printParseResultError(printer: Printer, parseResult: ParseResult): void {
        let errorString = 'Parse error for';
        if (isGlobalCommand(parseResult.command)) {
            errorString = `${errorString} global command`;
        } else if (isGlobalModifierCommand(parseResult.command)) {
            errorString = `${errorString} global modifier command`;
        } else {
            errorString = `${errorString} command`;
        }
        errorString = `${errorString} ${printer.yellow(
            (_.isUndefined(parseResult.groupCommand) ? '' : `${parseResult.groupCommand.name}:`)
            + parseResult.command.name
        )}`;
        if (parseResult.invalidArgs.length > 0) {
            errorString = `${errorString} with`;
            if (parseResult.invalidArgs.length === 1) {
                errorString = `${errorString} arg `;
            } else {
                errorString = `${errorString} args `;
            }
            const argsString = parseResult.invalidArgs.map(
                (arg) => printer.yellow(DefaultRunner.getInvalidArgString(arg,
                    isGlobalModifierCommand(parseResult.command) || isGlobalCommand(parseResult.command)))
            ).join(' ');
            errorString = `${errorString}${argsString}`;
        }
        printer.error(`${errorString}\n`, Icon.FAILURE);
    }

    private static getCommandString(printer: Printer, command: Command, commandArgs: CommandArgs,
        groupCommand?: GroupCommand): string {
        let commandString;
        if (isGlobalCommand(command)) {
            commandString = 'global command ';
        } else if (isGlobalModifierCommand(command)) {
            commandString = 'global modifier command ';
        } else if (isGroupCommand(command)) {
            commandString = 'group command ';
        } else {
            commandString = 'command ';
        }
        if (groupCommand) {
            commandString = `${commandString}${printer.yellow(`${groupCommand.name}:`)}`;
        }
        commandString = `${commandString}${printer.yellow(command.name)}`;
        const keys = Object.keys(commandArgs);
        if (keys.length > 0) {
            commandString = `${commandString} with`;
            if (keys.length === 1) {
                commandString = `${commandString} arg `;
            } else {
                commandString = `${commandString} args `;
            }

            const skipArgName = isGlobalModifierCommand(command) || isGlobalCommand(command);
            commandString += Object.keys(commandArgs).map((arg) => {
                if (skipArgName) {
                    return printer.yellow(`${commandArgs[arg]}`);
                }
                return printer.yellow(`${arg}=${commandArgs[arg]}`);
            }).join(', ');
        }
        return commandString;
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if:
     *
     * * a default command is specified and it is not a [[SubCommand]] or [[GlobalCommand]]
     * * there is an error caused by the CLI framework implementation
     */
    public async run(args: string[], context: Context, defaultCommand?: Command): Promise<RunResult> {

        const printer = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        if (defaultCommand && !isGlobalCommand(defaultCommand) && !isSubCommand(defaultCommand)) {
            throw new Error(`Default command: ${defaultCommand.name} is not a global command or sub-command`);
        }

        // validate default command if specified
        if (defaultCommand) {
            validateCommand(defaultCommand);
        }

        // provide the command registry to the parser
        this.parser.setCommandRegistry(context.commandRegistry);

        // scan for command clauses
        const scanResult: ScanResult = this.parser.scanForCommandClauses(args);

        // categorise the clauses
        const modifierClauses: CommandClause[] = [];
        const nonModifierClauses: CommandClause[] = [];

        scanResult.commandClauses.forEach((commandClause) => {
            if (isGlobalModifierCommand(commandClause.command)) {
                modifierClauses.push(commandClause);
            } else {
                nonModifierClauses.push(commandClause);
            }
        });

        // check if more than one non-modifier command has been specified
        if (nonModifierClauses.length > 1) {
            printer.error('More than one command specified: '
                + `${nonModifierClauses.map((clause) => printer.yellow(clause.command.name)).join(', ')}`);
            return RunResult.ParseError;
        }
        const nonModifierClause = nonModifierClauses[0];

        // sort the global modifier clauses in order of run priority
        modifierClauses.sort((a, b): number => {
            const commandA = a.command as GlobalModifierCommand;
            const commandB = b.command as GlobalModifierCommand;
            return (commandA.runPriority < commandB.runPriority) ? 1 : -1;
        });

        // store an overall list of unused args
        let overallUnusedArgs: string[] = [];

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
            const modifierParseResult = this.parser.parseCommandClause(modifierClause, config);

            // fast fail on a parse error
            if (modifierParseResult.invalidArgs.length > 0) {
                DefaultRunner.printParseResultError(printer, modifierParseResult);
                return RunResult.ParseError;
            }
            const { unusedArgs } = modifierParseResult;

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
            const { command: modifierCommand, commandArgs: modifierCommandArgs } = modifierParseResult;
            const modifierMessage = DefaultRunner.getCommandString(printer, modifierCommand, modifierCommandArgs);
            this.log(`Running ${modifierMessage}`);
            try {
                // eslint-disable-next-line no-await-in-loop
                await modifierCommand.run(modifierCommandArgs, context);
            } catch (err) {
                printer.error(`Error running ${modifierMessage}:\n  ${printer.red(err.message)}\n`, Icon.FAILURE);
                return RunResult.CommandError;
            }
        }
        let parseResult;

        // parse non-modifier clause to run
        if (!_.isUndefined(nonModifierClause)) {
            this.log(`Attempting to parse command clause, with command: ${nonModifierClause.command.name}`);
            const config = context.commandConfigs.get(nonModifierClause.command.name);
            parseResult = this.parser.parseCommandClause(nonModifierClause, config);

            // fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                DefaultRunner.printParseResultError(printer, parseResult);
                return RunResult.ParseError;
            }

            // shift all potential default clause args to unused args
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];
                overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
            }
        }

        // parse any potential default command clauses
        if ((parseResult === undefined) && (potentialDefaultClauses.length > 0)) {
            this.log('No command specified, looking for a potential default in potential default clauses');
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];

                // check if default was already found, if so just shift all other potential clause args to unused
                if (parseResult) {
                    overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                } else {
                    const config = context.commandConfigs.get(potentialCommandClause.command.name);
                    const potentialDefaultParseResult = this.parser.parseCommandClause(potentialCommandClause, config);

                    // ignore if there are parse errors
                    if (potentialDefaultParseResult.invalidArgs.length > 0) {
                        this.log(`Failed to parse potential clause with command: ${
                            potentialCommandClause.command.name}`);
                        overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
                    } else {
                        this.log(`Parsed potential clause with command: ${potentialCommandClause.command.name}`);
                        parseResult = potentialDefaultParseResult;
                    }
                }
            }
        }

        // no command found yet, check if default with no args is valid
        if ((parseResult === undefined) && defaultCommand) {
            this.log('Attempting to parse default command with all unused args');
            let potentialCommandClause: CommandClause = {
                command: defaultCommand,
                potentialArgs: overallUnusedArgs
            };
            const config = context.commandConfigs.get(defaultCommand.name);
            const parseResultWithArgs = this.parser.parseCommandClause(potentialCommandClause, config);

            // if we parsed successfully, store unused args
            if (parseResultWithArgs.invalidArgs.length === 0) {
                parseResult = parseResultWithArgs;
                overallUnusedArgs = parseResultWithArgs.unusedArgs;
            } else {
                this.log('Attempting to parse default command with config only');
                potentialCommandClause = {
                    command: defaultCommand,
                    potentialArgs: []
                };
                // if we parsed successfully, unused args remains as it was
                const parseResultWithNoArgs = this.parser.parseCommandClause(potentialCommandClause, config);
                if (parseResultWithNoArgs.invalidArgs.length === 0) {
                    parseResult = parseResultWithNoArgs;
                } else {
                    // reached the end of the road here... report on the error when we tried to use the args
                    DefaultRunner.printParseResultError(printer, parseResultWithArgs);
                    return RunResult.ParseError;
                }
            }
        }

        if (!parseResult) {
            printer.error('No command specified!');
            return RunResult.ParseError;
        }

        // warn on unused args
        overallUnusedArgs.push(...parseResult.unusedArgs);
        if (overallUnusedArgs.length > 0) {
            // output any unused args, parsing error or run error on stderr
            if (overallUnusedArgs.length === 1) {
                printer.warn(`Unused arg: ${printer.yellow(overallUnusedArgs[0])}\n`, Icon.ALERT);
            } else {
                printer.warn(`Unused args: ${printer.yellow(overallUnusedArgs.join(' '))}\n`, Icon.ALERT);
            }
        }

        const { groupCommand, command, commandArgs } = parseResult;

        let message;
        try {
            if (groupCommand) {
                message = DefaultRunner.getCommandString(printer, groupCommand, commandArgs);
                this.log(`Running ${message}`);
                await groupCommand.run({}, context);
            }
            message = DefaultRunner.getCommandString(printer, command, commandArgs, groupCommand);
            this.log(`Running ${message}`);
            await command.run(commandArgs, context);
        } catch (err) {
            printer.error(`Error running ${message}:\n  ${printer.red(err.message)}\n`, Icon.FAILURE);
            return RunResult.CommandError;
        }

        return RunResult.Success;
    }
}
