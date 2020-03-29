/* eslint-disable max-classes-per-file,class-methods-use-this */

import _ from 'lodash';
import leven from 'leven';
import Command, { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { Icon, STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import SubCommand from '../../api/SubCommand';
import GlobalCommand from '../../api/GlobalCommand';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import Configuration, { CONFIGURATION_SERVICE } from '../service/ConfigurationService';
import {
    isGlobalCommand,
    isGlobalModifierCommand,
    isGroupCommand,
    isSubCommand
} from '../../api/CommandTypeGuards';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';
import GroupCommand from '../../api/GroupCommand';
import { ArgumentValueTypeName } from '../../api/ArgumentValueType';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';

/**
 * @module @flowscripter/cli-framework
 */

interface HelpEntry {
    readonly syntax: string;
    readonly description?: string;
    readonly notes?: string[];
}

interface HelpSection {
    readonly title: string;
    readonly entries: HelpEntry[];
}

const SYNTAX_INDENT_WIDTH = 6;

const SYNTAX_COLUMN_WIDTH = 24;

const SYNTAX_MIN_PADDING_WIDTH = 2;

/**
 * Provides common implementation for both [[HelpGlobalCommand]] and [[HelpSubCommand]].
 */
class CommonHelpCommand {

    readonly appName: string;

    readonly appDescription: string;

    readonly appVersion: string;

    readonly name = 'help';

    readonly description = 'Display application help';

    private readonly helpEntryIndent = ' '.repeat(SYNTAX_INDENT_WIDTH);

    /**
     * @param appName the name of the application
     * @param appDescription a description for the application
     * @param appVersion the version of the application
     */
    public constructor(appName: string, appDescription: string, appVersion: string) {
        this.appName = appName;
        this.appDescription = appDescription;
        this.appVersion = appVersion;
    }

    private getAppSyntax(
        globalModifierCommands: GlobalModifierCommand[],
        globalCommands: GlobalCommand[],
        groupCommands: GroupCommand[],
        subCommands: SubCommand[]
    ): string {
        let syntax = this.appName;
        if (globalModifierCommands.length > 0) {
            syntax += ' [global options [arguments]]';
        }
        const commandClauses = [];
        if (globalCommands.length > 0) {
            commandClauses.push('global command');
        }
        if ((groupCommands.length > 0) || (subCommands.length > 0)) {
            commandClauses.push('command');
        }
        if (commandClauses.length > 0) {
            syntax += ` [${commandClauses.join('|')} [arguments]]`;
        }
        return syntax;
    }

    private static getGlobalCommandArgumentSyntax(argument: GlobalCommandArgument): string {
        let argumentSyntax;
        if (!_.isUndefined(argument.validValues) && !_.isEmpty(argument.validValues)) {
            argumentSyntax = argument.validValues.join('|');
        } else if (argument.type === ArgumentValueTypeName.Boolean) {
            argumentSyntax = 'true|false';
        } else {
            argumentSyntax = `<${argument.name}>`;
        }
        if (argument.isOptional || argument.type === ArgumentValueTypeName.Boolean
            || !_.isUndefined(argument.defaultValue)) {
            argumentSyntax = ` [${argumentSyntax}]`;
        } else {
            argumentSyntax = ` ${argumentSyntax}`;
        }
        return argumentSyntax;
    }

    private static getGlobalArgumentSyntaxAndDescription(globalCommand: GlobalCommand): [string, string] {
        const { argument } = globalCommand;
        if (_.isUndefined(argument)) {
            return ['', ''];
        }
        const argumentSyntax = CommonHelpCommand.getGlobalCommandArgumentSyntax(argument);
        let argumentDescription = globalCommand.description || '';

        if (!_.isUndefined(argument.defaultValue)) {
            if (argumentDescription.length === 0) {
                argumentDescription = `(default: ${argument.defaultValue})`;
            } else {
                argumentDescription = `${argumentDescription} (default: ${argument.defaultValue})`;
            }
        }
        return [argumentSyntax, argumentDescription];
    }

    private static getGlobalCommandsHelpSection(title: string, globalCommands: GlobalCommand[]): HelpSection {
        const globalCommandsSection: HelpSection = {
            title,
            entries: []
        };
        globalCommands.forEach((globalCommand) => {
            const [argumentSyntax, argumentDescription] = CommonHelpCommand.getGlobalArgumentSyntaxAndDescription(
                globalCommand
            );
            globalCommandsSection.entries.push({
                syntax: `--${globalCommand.name}${argumentSyntax}`,
                description: argumentDescription
            });
            if (!_.isUndefined(globalCommand.shortAlias)) {
                globalCommandsSection.entries.push({
                    syntax: `-${globalCommand.shortAlias}${argumentSyntax}`,
                    description: argumentDescription
                });
            }
        });
        return globalCommandsSection;
    }

    private getSortedCommands(commands: Command[]):
        [GlobalModifierCommand[], GlobalCommand[], GroupCommand[], SubCommand[]] {

        const globalModifiers: GlobalModifierCommand[] = [];
        const globalCommands: GlobalCommand[] = [];
        const groupCommands: GroupCommand[] = [];
        const subCommands: SubCommand[] = [];

        _.sortBy(commands, 'name').forEach((command) => {
            if (isGlobalModifierCommand(command)) {
                globalModifiers.push(command as GlobalModifierCommand);
            } else if (isGlobalCommand(command)) {
                globalCommands.push(command);
            } else if (isGroupCommand(command)) {
                groupCommands.push(command);
            } else {
                subCommands.push(command as SubCommand);
            }
        });
        return [globalModifiers, globalCommands, groupCommands, subCommands];
    }

    private getSortedNonGlobalCommands(commands: Command[]): [GroupCommand[], SubCommand[]] {

        const groupCommands: GroupCommand[] = [];
        const subCommands: SubCommand[] = [];

        _.sortBy(commands, 'name').forEach((command) => {
            if (isGroupCommand(command)) {
                groupCommands.push(command);
            } else if (isSubCommand(command)) {
                subCommands.push(command as SubCommand);
            }
        });
        return [groupCommands, subCommands];
    }

    private findCommand(commandName: string, groupCommands: GroupCommand[], subCommands: SubCommand[]):
        [ GroupCommand | undefined, SubCommand | undefined] {
        let command = subCommands.find((subCommand) => {
            if (subCommand.name === commandName) {
                return subCommand;
            }
            return undefined;
        });
        if (!_.isUndefined(command)) {
            return [undefined, command];
        }
        for (let i = 0; i < groupCommands.length; i += 1) {
            const groupCommand = groupCommands[i];
            command = groupCommand.memberSubCommands.find((memberCommand) => {
                if (`${groupCommand.name}:${memberCommand.name}` === commandName) {
                    return memberCommand;
                }
                return undefined;
            });
            if (!_.isUndefined(command)) {
                return [groupCommand, command];
            }
        }
        return [undefined, undefined];
    }

    private findPossibleCommandNames(commandName: string, groupCommands: GroupCommand[], subCommands: SubCommand[]):
        string[] {
        const levenCommandArray = new Array<[number, string]>();
        subCommands.forEach((subCommand) => {
            levenCommandArray.push([leven(subCommand.name, commandName), subCommand.name]);
        });
        groupCommands.forEach((groupCommand) => {
            groupCommand.memberSubCommands.forEach((memberCommand) => {
                const memberName = `${groupCommand.name}:${memberCommand.name}`;
                levenCommandArray.push([leven(memberName, commandName), memberName]);
            });
        });
        return levenCommandArray
            .sort((a, b) => b[0] - a[0])
            .slice(0, 2)
            .filter((value) => value[0] < 3)
            .map((value) => value[1]);
    }

    private getArgumentsSyntax(subCommand: SubCommand): string {
        let syntax = '';

        subCommand.options.forEach((option) => {
            let optionSyntax = `--${option.name}=<value>`;
            if (option.isOptional || option.type === ArgumentValueTypeName.Boolean
                || !_.isUndefined(option.defaultValue)) {
                optionSyntax = ` [${optionSyntax}]`;
            } else {
                optionSyntax = ` ${optionSyntax}`;
            }
            if (option.isArray) {
                optionSyntax = ` ${optionSyntax}...`;
            }
            syntax = `${syntax}${optionSyntax}`;
        });

        subCommand.positionals.forEach((positional) => {
            let positionalSyntax = `<${positional.name}>`;
            if (positional.isVarArgOptional || positional.type === ArgumentValueTypeName.Boolean) {
                positionalSyntax = ` [${positionalSyntax}]`;
            } else {
                positionalSyntax = ` ${positionalSyntax}`;
            }
            if (positional.isVarArgMultiple) {
                positionalSyntax = ` ${positionalSyntax}...`;
            }
            syntax = `${syntax}${positionalSyntax}`;
        });
        return syntax;
    }

    private static getOptionHelpEntry(option: Option): HelpEntry {
        const notes: string[] = [];
        const helpEntry: HelpEntry = {
            syntax: `--${option.name}${_.isUndefined(option.shortAlias) ? `, -${option.shortAlias}` : ''}`,
            description: option.description,
            notes
        };
        if (!_.isUndefined(option.defaultValue)) {
            notes.push(`Default: ${_.isArray(option.defaultValue) ? `${option.defaultValue.join(',')}`
                : `${option.defaultValue}`}`);
        }
        if (option.isOptional) {
            notes.push('Optional');
        }
        if (option.isArray) {
            notes.push('Multiple entries supported');
        }
        return helpEntry;
    }

    private static getPositionalHelpEntry(positional: Positional): HelpEntry {
        const notes: string[] = [];
        const helpEntry: HelpEntry = {
            syntax: `<${positional.name}>`,
            description: positional.description,
            notes
        };
        if (positional.isVarArgOptional) {
            notes.push('Optional');
        }
        if (positional.isVarArgMultiple) {
            notes.push('Multiple entries supported');
        }
        return helpEntry;
    }

    private getSpecificHelpSections(name: string, subCommand: SubCommand): HelpSection[] {
        const helpSections: HelpSection[] = [];
        if (_.isString(subCommand.description) && (subCommand.description.length > 0)) {
            helpSections.push({
                title: subCommand.description,
                entries: []
            });
        }
        helpSections.push({
            title: 'Usage:',
            entries: [{
                syntax: `${this.appName} ${name} ${this.getArgumentsSyntax(subCommand)}`
            }]
        });
        if (!_.isEmpty(subCommand.options) || !_.isEmpty(subCommand.positionals)) {
            const argumentsSection: HelpSection = {
                title: 'Where:',
                entries: []
            };
            subCommand.options.forEach((option) => {
                argumentsSection.entries.push(CommonHelpCommand.getOptionHelpEntry(option));
            });
            subCommand.positionals.forEach((positional) => {
                argumentsSection.entries.push(CommonHelpCommand.getPositionalHelpEntry(positional));
            });
            helpSections.push(argumentsSection);
        }
        if (!_.isUndefined(subCommand.usageExamples) && !_.isEmpty(subCommand.usageExamples)) {
            const usageSection: HelpSection = {
                title: subCommand.usageExamples.length > 1 ? 'Examples:' : 'Example:',
                entries: []
            };
            helpSections.push(usageSection);
            subCommand.usageExamples.forEach((usageExample) => {
                if (_.isString(usageExample.description) && (usageExample.description.length > 0)) {
                    usageSection.entries.push({
                        syntax: `# ${usageExample.description}`
                    });
                }
                usageSection.entries.push({
                    syntax: `$ ${this.appName} ${usageExample.exampleArguments}`
                });
                if (!_.isUndefined(usageExample.output)) {
                    usageExample.output.forEach((output) => {
                        usageSection.entries.push({
                            syntax: output
                        });
                    });
                }
            });
        }
        return helpSections;
    }

    private getGenericHelpSections(
        globalModifierCommands: GlobalModifierCommand[],
        globalCommands: GlobalCommand[],
        groupCommands: GroupCommand[],
        subCommands: SubCommand[]
    ): HelpSection[] {

        const helpSections: HelpSection[] = [];
        if (globalModifierCommands.length > 0) {
            helpSections.push(CommonHelpCommand.getGlobalCommandsHelpSection(
                'Global options:', globalModifierCommands
            ));
        }
        if (globalCommands.length > 0) {
            helpSections.push(CommonHelpCommand.getGlobalCommandsHelpSection(
                'Global commands:', globalModifierCommands
            ));
        }
        groupCommands.forEach((groupCommand) => {
            const topicSection: HelpSection = {
                title: `${groupCommand.name.charAt(0).toUpperCase() + groupCommand.name.slice(1)} commands:`,
                entries: []
            };
            groupCommand.memberSubCommands.forEach((memberCommand) => {
                topicSection.entries.push({
                    syntax: `${groupCommand.name}:${memberCommand.name}`,
                    description: memberCommand.description
                });
            });
            helpSections.push(topicSection);
        });
        if (subCommands.length > 0) {
            const subCommandsByTopic = new Map<string, SubCommand[]>();
            const otherSubCommands: SubCommand[] = [];

            subCommands.forEach((subCommand) => {
                if (_.isUndefined(subCommand.topic)) {
                    otherSubCommands.push(subCommand);
                } else {
                    const commands = subCommandsByTopic.get(subCommand.topic) || [];
                    commands.push(subCommand);
                    subCommandsByTopic.set(subCommand.topic, commands);
                }
            });

            for (const key of subCommandsByTopic.keys()) {
                const topicCommands = subCommandsByTopic.get(key);
                if (!_.isUndefined(topicCommands)) {
                    const topicSection: HelpSection = {
                        title: `${key.charAt(0).toUpperCase() + key.slice(1)} commands:`,
                        entries: []
                    };
                    topicCommands.forEach((subCommand) => {
                        topicSection.entries.push({
                            syntax: subCommand.name,
                            description: subCommand.description
                        });
                    });
                    helpSections.push(topicSection);
                }
            }

            if (otherSubCommands.length > 0) {
                const topicSection: HelpSection = {
                    title: 'Other commands:',
                    entries: []
                };
                otherSubCommands.forEach((subCommand) => {
                    topicSection.entries.push({
                        syntax: subCommand.name,
                        description: subCommand.description
                    });
                });
                helpSections.push(topicSection);
            }
        }
        return helpSections;
    }

    private printSections(printer: Printer, sections: HelpSection[]): void {
        sections.forEach((section) => {
            printer.info(`${section.title}\n`);
            section.entries.forEach((entry) => {
                let notesIndent = SYNTAX_INDENT_WIDTH + SYNTAX_COLUMN_WIDTH + SYNTAX_INDENT_WIDTH;
                if (entry.description) {
                    let paddingCount = SYNTAX_COLUMN_WIDTH - entry.syntax.length;
                    if (paddingCount < SYNTAX_MIN_PADDING_WIDTH) {
                        paddingCount = SYNTAX_MIN_PADDING_WIDTH;
                    }
                    const padding = ' '.repeat(paddingCount);
                    printer.info(this.helpEntryIndent + entry.syntax + padding + entry.description);
                    notesIndent = SYNTAX_INDENT_WIDTH + entry.syntax.length + paddingCount + SYNTAX_INDENT_WIDTH;
                } else {
                    printer.info(this.helpEntryIndent + entry.syntax);
                }
                if (entry.notes) {
                    const notesPadding = ' '.repeat(notesIndent);
                    entry.notes.forEach((note) => {
                        printer.info(notesPadding + note);
                    });
                }
            });
            printer.info('\n');
        });
    }

    /**
     * Prints generic CLI help. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]]
     * ID in the provided [[Context]].
     *
     * If an implementation of [[Configuration]] is registered with the [[CONFIGURATION_SERVICE]] ID in the provided
     * [[Context]] it will be used to display the configuration location.
     *
     * @param context the [[Context]] in which to run.
     */
    public async printGenericHelp(context: Context): Promise<void> {
        const printer = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }

        const [globalModifierCommands, globalCommands,
            groupCommands, subCommands] = this.getSortedCommands(context.commands);

        // display generic help
        const helpSections: HelpSection[] = [];

        helpSections.push({
            title: this.appDescription,
            entries: [
                {
                    syntax: 'version:',
                    description: this.appVersion
                }
            ]
        });
        const configuration = context.getService(CONFIGURATION_SERVICE) as unknown as Configuration;
        if ((configuration != null) && (!_.isUndefined(configuration.configurationLocation))) {
            helpSections[0].entries.push({
                syntax: 'config:',
                description: configuration.configurationLocation
            });
        }

        helpSections.push({
            title: 'Usage:',
            entries: [
                {
                    syntax: this.getAppSyntax(globalModifierCommands, globalCommands, groupCommands, subCommands)
                }
            ]
        });

        helpSections.push(
            ...this.getGenericHelpSections(globalModifierCommands, globalCommands, groupCommands, subCommands)
        );

        this.printSections(printer, helpSections);
    }

    /**
     * Prints usage help for specified command. Expects an implementation of [[Printer]] registered with the
     * [[STDOUT_PRINTER_SERVICE]] ID in the provided [[Context]].
     *
     * @param context the [[Context]] in which to run.
     * @param commandName name of the command for which to show help.
     */
    public async printUsageHelp(context: Context, commandName: string): Promise<void> {
        const printer = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }

        const [groupCommands, subCommands] = this.getSortedNonGlobalCommands(context.commands);

        // find sub-command or group sub-command
        const [groupCommand, subCommand] = this.findCommand(commandName, groupCommands, subCommands);

        if (_.isUndefined(subCommand)) {

            printer.error(`Unknown command: ${commandName}`, Icon.FAILURE);

            // look for other possible matches
            const possibleCommandNames = this.findPossibleCommandNames(commandName, groupCommands, subCommands);
            if (!_.isEmpty(possibleCommandNames)) {
                printer.info(`Possible matches: ${possibleCommandNames.join(', ')}`, Icon.INFORMATION);
            }
            this.printGenericHelp(context);
            return;
        }

        // display command help
        const helpSections = this.getSpecificHelpSections(_.isUndefined(groupCommand)
            ? subCommand.name : `${groupCommand.name}:${subCommand.name}`, subCommand);
        this.printSections(printer, helpSections);
    }
}

/**
 * Implementation of CLI help available via either *--help* or *-h*
 */
export class HelpGlobalCommand extends CommonHelpCommand implements GlobalCommand {

    readonly shortAlias = 'h';

    readonly argument = {
        name: 'command',
        isOptional: true
    };

    /**
     * @inheritdoc
     *
     * Prints CLI help. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] ID
     * in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        if (_.isUndefined(commandArgs.command)) {
            this.printGenericHelp(context);
        } else {
            this.printUsageHelp(context, commandArgs.command as string);
        }
    }
}

/**
 * Implementation of CLI help available via either *help*
 */
export class HelpSubCommand extends CommonHelpCommand implements SubCommand {

    public readonly options: ReadonlyArray<Option> = [];

    public readonly positionals: ReadonlyArray<Positional> = [
        {
            name: 'command',
            isVarArgOptional: true
        }
    ];

    /**
     * @inheritdoc
     *
     * Prints CLI help. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] ID
     * in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        if (_.isUndefined(commandArgs.command)) {
            this.printGenericHelp(context);
        } else {
            this.printUsageHelp(context, commandArgs.command as string);
        }
    }
}