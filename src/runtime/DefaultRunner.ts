/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import debug from 'debug';
import Runner, { RunResult } from '../api/Runner';
import Context from '../api/Context';
import Parser, { CommandClause, ParseResult, ScanResult } from '../api/Parser';
import { isGlobalCommand, isGlobalModifierCommand, isSubCommand } from '../api/CommandTypeGuards';
import Command from '../api/Command';
import validateCommand from './CommandValidation';
import GlobalModifierCommand from '../api/GlobalModifierCommand';
import Printer, { Icon, STDERR_PRINTER_SERVICE } from '../core/service/PrinterService';

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

    // eslint-disable-next-line class-methods-use-this
    private printParseResultError(parseResult: ParseResult, printer: Printer): void {
        let errorString = 'Parse error for';
        if (isGlobalCommand(parseResult.command)) {
            errorString = `${errorString} global command`;
        } else if (isGlobalModifierCommand(parseResult.command)) {
            errorString = `${errorString} global modifier command`;
        } else {
            errorString = `${errorString} command`;
        }
        if (parseResult.invalidArgs.length > 0) {
            errorString = `${errorString} and args:`;
            const argsString = parseResult.invalidArgs.map((arg) => {
                if (isGlobalModifierCommand(parseResult.command) || isGlobalCommand(parseResult.command)) {
                    if (_.isUndefined(arg.value)) {
                        return '';
                    }
                    return printer.yellow(`${arg.value}`);
                }
                if (_.isUndefined(arg.name)) {
                    return '';
                }
                return printer.yellow(arg.name + _.isUndefined(arg.value) ? '' : `=${arg.value}`);
            }).join(' ');
            errorString = `${errorString} ${argsString}`;
        }
        printer.error(errorString);
    }

    /**
     * Attempt to successfully parse a non-modifier [[Command]] clause from the potential
     * non-modifier and default clauses provided.
     *
     * @param nonModifierClause potential non-modifier [[CommandClause]] instances.
     * @param potentialDefaultClauses potential default [[CommandClause]] instances.
     * @param overallUnusedArgs current list of unused args. This will be appended to during this parsing operation.
     * @param context the [[Context]] for the CLI invocation.
     * @param defaultCommand optional [[Command]] implementation.
     * @return a [[ParseResult]] for a successfully parsed [[CommandClause]] or a parse error,
     * or *undefined* if no clause was parsed.
     * @throws *Error* if there is a parsing error
     */
    private getNonModifierParseResult(nonModifierClause: CommandClause | undefined, potentialDefaultClauses:
        CommandClause[], overallUnusedArgs: string[], context: Context, defaultCommand?: Command): ParseResult
        | undefined {

        let parseResult;

        // look for a default if we don't have a non-modifier command
        if (_.isUndefined(nonModifierClause)) {
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
            const config = context.commandConfigs.get(nonModifierClause.command.name);
            parseResult = this.parser.parseCommandClause(nonModifierClause, config);

            // fail on a parse error
            if (parseResult.invalidArgs.length > 0) {
                return parseResult;
            }
            // shift all potential default clause args to unused args
            for (let i = 0; i < potentialDefaultClauses.length; i += 1) {
                const potentialCommandClause = potentialDefaultClauses[i];
                overallUnusedArgs.push(...potentialCommandClause.potentialArgs);
            }
        }
        return parseResult;
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
                this.printParseResultError(parseResult, printer);
                return RunResult.ParseError;
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
                + `${Object.keys(commandArgs).map((arg) => `${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            try {
                // eslint-disable-next-line no-await-in-loop
                await command.run(commandArgs, context);
            } catch (err) {
                printer.error(`Error running ${message}:  ${printer.red(err.message)}`);
                return RunResult.CommandError;
            }
        }

        // perform final determination of non-modifier clause to run
        const parseResult = this.getNonModifierParseResult(nonModifierClause, potentialDefaultClauses,
            overallUnusedArgs, context, defaultCommand);

        if (!parseResult) {
            printer.error('No command specified and no default available!');
            return RunResult.ParseError;
        }
        if (parseResult.invalidArgs.length > 0) {
            this.printParseResultError(parseResult, printer);
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
                message = `command: ${groupCommand.name} with args: `
                    + `${Object.keys(commandArgs).map((arg) => `${commandArgs[arg]}`).join(', ')}`;
                this.log(`Running ${message}`);
                await groupCommand.run({}, context);
            }
            message = `command: ${groupCommand ? `${groupCommand.name}:` : ''}${command.name} with args: `
                + `${Object.keys(commandArgs).map((arg) => `${arg}=${commandArgs[arg]}`).join(', ')}`;
            this.log(`Running ${message}`);
            await command.run(commandArgs, context);
        } catch (err) {
            printer.error(`Error running ${message}:  ${printer.red(err.message)}`);
            return RunResult.CommandError;
        }

        return RunResult.Success;
    }
}
