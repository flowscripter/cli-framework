/* eslint-disable max-classes-per-file,class-methods-use-this */

import _ from 'lodash';
import leven from 'leven';
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { Icon, STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import SubCommand from '../../api/SubCommand';
import GlobalCommand from '../../api/GlobalCommand';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import Configuration, { CONFIGURATION_SERVICE } from '../service/ConfigurationService';
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

const SYNTAX_INDENT_WIDTH = 2;

const SYNTAX_COLUMN_WIDTH = 24;

const SYNTAX_MIN_PADDING_WIDTH = 2;

/**
 * Provides common implementation for both [[HelpGlobalCommand]] and [[HelpSubCommand]].
 */
class CommonHelpCommand {

    protected appName: string | undefined;

    protected appDescription: string | undefined;

    protected appVersion: string | undefined;

    readonly name = 'help';

    readonly description = 'Display application help';

    private readonly helpEntryIndent = ' '.repeat(SYNTAX_INDENT_WIDTH);

    private getAppSyntax(
        globalModifierCommands: GlobalModifierCommand[],
        globalCommands: GlobalCommand[],
        groupCommands: GroupCommand[],
        subCommands: SubCommand[]
    ): string {
        let syntax = this.appName || '';
        if (globalModifierCommands.length > 0) {
            syntax += ' [<global_option> [<arg>]]';
        }
        if (globalModifierCommands.length > 1) {
            syntax += '...';
        }
        const commandClauses = [];
        if (globalCommands.length > 0) {
            commandClauses.push('<global_command>');
        }
        if ((groupCommands.length > 0) || (subCommands.length > 0)) {
            commandClauses.push('<command>');
        }
        if (commandClauses.length > 0) {
            syntax += ` [${commandClauses.join('|')} [<arg> [<value>]]...]`;
        }
        return syntax;
    }

    private static getGlobalCommandArgumentSyntax(argument: GlobalCommandArgument): string {
        let argumentSyntax;
        if (argument.type === ArgumentValueTypeName.Boolean) {
            argumentSyntax = 'true|false';
        } else {
            argumentSyntax = `<${argument.name}>`;
        }
        if (argument.isOptional || argument.type === ArgumentValueTypeName.Boolean) {
            argumentSyntax = ` [${argumentSyntax}]`;
        } else {
            argumentSyntax = ` ${argumentSyntax}`;
        }
        return argumentSyntax;
    }

    private static getGlobalArgumentSyntaxAndDescription(globalCommand: GlobalCommand): [string, string] {
        const { argument } = globalCommand;
        let argumentDescription = globalCommand.description || '';
        if (_.isUndefined(argument)) {
            return ['', argumentDescription];
        }
        const argumentSyntax = CommonHelpCommand.getGlobalCommandArgumentSyntax(argument);

        if (!_.isUndefined(argument.validValues) && !_.isEmpty(argument.validValues)) {
            if (argumentDescription.length === 0) {
                argumentDescription = `(valid values: ${argument.validValues.join(',')})`;
            } else {
                argumentDescription = `${argumentDescription} (valid values: ${argument.validValues.join(',')})`;
            }
        }

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
            .sort((a, b) => a[0] - b[0])
            .slice(0, 2)
            .filter((value) => value[0] < 3)
            .map((value) => value[1]);
    }

    private getArgumentsSyntax(subCommand: SubCommand): string {
        let syntax = '';

        subCommand.options.forEach((option) => {
            let optionSyntax = `--${option.name}=<value>`;
            if (option.isOptional || option.type === ArgumentValueTypeName.Boolean) {
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
            syntax: `--${option.name}${!_.isUndefined(option.shortAlias) ? `, -${option.shortAlias}` : ''}`,
            description: option.description,
            notes
        };
        if (!_.isUndefined(option.validValues) && !_.isEmpty(option.validValues)) {
            notes.push(`(valid values: ${option.validValues.join(',')})`);
        }
        if (!_.isUndefined(option.defaultValue)) {
            notes.push(`(default: ${_.isArray(option.defaultValue) ? `${option.defaultValue.join(',')}`
                : `${option.defaultValue}`})`);
        }
        if (option.isOptional) {
            notes.push('(optional)');
        }
        if (option.isArray) {
            notes.push('(multiple entries supported)');
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
        if (!_.isUndefined(positional.validValues) && !_.isEmpty(positional.validValues)) {
            notes.push(`(valid values: ${positional.validValues.join(',')})`);
        }
        if (positional.isVarArgOptional) {
            notes.push('(optional)');
        }
        if (positional.isVarArgMultiple) {
            notes.push('(multiple entries supported)');
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
            title: 'Usage',
            entries: [{
                syntax: `${this.appName} ${name}${this.getArgumentsSyntax(subCommand)}`
            }]
        });
        if (!_.isEmpty(subCommand.options) || !_.isEmpty(subCommand.positionals)) {
            const argumentsSection: HelpSection = {
                title: 'Arguments',
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
                title: subCommand.usageExamples.length > 1 ? 'Examples' : 'Example',
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
                    syntax: `$ ${this.appName} ${subCommand.name} ${usageExample.exampleArguments}`
                });
                if (!_.isUndefined(usageExample.output)) {
                    usageExample.output.forEach((output) => {
                        usageSection.entries.push({
                            syntax: output
                        });
                    });
                }
                usageSection.entries.push({
                    syntax: ''
                });
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
                'Global Options', globalModifierCommands
            ));
        }
        if (globalCommands.length > 0) {
            helpSections.push(CommonHelpCommand.getGlobalCommandsHelpSection(
                'Global Commands', globalCommands
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
                        title: `${key.charAt(0).toUpperCase() + key.slice(1)} Commands`,
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
                    title: 'Other Commands',
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
        printer.info('\n');
        sections.forEach((section) => {
            printer.info(`${section.title}\n\n`);
            section.entries.forEach((entry) => {
                let notesIndent = SYNTAX_INDENT_WIDTH + SYNTAX_COLUMN_WIDTH + SYNTAX_INDENT_WIDTH;
                if (entry.description) {
                    let paddingCount = SYNTAX_COLUMN_WIDTH - entry.syntax.length;
                    if (paddingCount < SYNTAX_MIN_PADDING_WIDTH) {
                        paddingCount = SYNTAX_MIN_PADDING_WIDTH;
                    }
                    const padding = ' '.repeat(paddingCount);
                    printer.info(`${printer.dim(this.helpEntryIndent + entry.syntax + padding + entry.description)}`);
                    notesIndent = SYNTAX_INDENT_WIDTH + entry.syntax.length + paddingCount;
                } else {
                    printer.info(`${printer.dim(this.helpEntryIndent + entry.syntax)}`);
                }
                if (entry.notes) {
                    const notesPadding = ' '.repeat(notesIndent);
                    entry.notes.forEach((note) => {
                        printer.info(`\n${printer.dim(notesPadding + note)}`);
                    });
                }
                printer.info('\n');
            });
            if (section.entries.length > 0) {
                printer.info('\n');
            }
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
    public printGenericHelp(context: Context): void {
        const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!printer) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }

        const globalModifierCommands = Array.from(context.commandRegistry.getGlobalModifierCommands());
        const globalCommands = Array.from(context.commandRegistry.getGlobalCommands());
        const groupCommands = Array.from(context.commandRegistry.getGroupCommands());
        const subCommands = Array.from(context.commandRegistry.getSubCommands());

        // display generic help
        const helpSections: HelpSection[] = [];

        helpSections.push({
            title: this.appDescription || '',
            entries: [
                {
                    syntax: 'version',
                    description: this.appVersion
                }
            ]
        });
        const configuration = context.serviceRegistry.getServiceById(CONFIGURATION_SERVICE) as unknown as Configuration;
        if (configuration && (!_.isUndefined(configuration.configurationLocation))) {
            helpSections[0].entries.push({
                syntax: 'config',
                description: configuration.configurationLocation
            });
        }

        helpSections.push({
            title: 'Usage',
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
    public printUsageHelp(context: Context, commandName: string): void {
        const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!printer) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }

        const groupCommands = Array.from(context.commandRegistry.getGroupCommands());
        const subCommands = Array.from(context.commandRegistry.getSubCommands());

        // find sub-command or group sub-command
        const [groupCommand, subCommand] = this.findCommand(commandName, groupCommands, subCommands);

        if (_.isUndefined(subCommand)) {

            printer.error(`Unknown command: ${printer.red(commandName)}\n`, Icon.FAILURE);

            // look for other possible matches
            const possibleCommandNames = this.findPossibleCommandNames(commandName, groupCommands, subCommands);
            if (!_.isEmpty(possibleCommandNames)) {
                printer.info(`Possible matches: ${possibleCommandNames.join(', ')}\n`, Icon.INFORMATION);
            }
            this.printGenericHelp(context);
            return;
        }

        // display command help
        const helpSections = this.getSpecificHelpSections(_.isUndefined(groupCommand)
            ? subCommand.name : `${groupCommand.name}:${subCommand.name}`, subCommand);
        this.printSections(printer, helpSections);
    }

    /**
     * @inheritdoc
     *
     * Prints CLI help. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] ID
     * in the provided [[Context]].
     */
    public run(commandArgs: CommandArgs, context: Context): void {

        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.name)) {
            throw new Error('Provided context is missing property: "cliConfig.name: string"');
        }
        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.description)) {
            throw new Error('Provided context is missing property: "cliConfig.description: string"');
        }
        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.version)) {
            throw new Error('Provided context is missing property: "cliConfig.version: string"');
        }
        this.appName = context.cliConfig.name;
        this.appDescription = context.cliConfig.description;
        this.appVersion = context.cliConfig.version;

        if (_.isUndefined(commandArgs.command)) {
            this.printGenericHelp(context);
        } else {
            this.printUsageHelp(context, commandArgs.command as string);
        }
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
}

/**
 * Implementation of CLI help available via either *help*
 */
export class HelpSubCommand extends CommonHelpCommand implements SubCommand {

    public readonly options: ReadonlyArray<Option> = [];

    public readonly positionals: ReadonlyArray<Positional> = [
        {
            name: 'command',
            isVarArgOptional: true,
            description: 'Display help for the specific <command>'
        }
    ];
}
