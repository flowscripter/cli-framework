/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable max-classes-per-file,class-methods-use-this,implicit-arrow-linebreak */

import _ from 'lodash';
import leven from 'leven';
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { Icon, STDERR_PRINTER_SERVICE, STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import SubCommand from '../../api/SubCommand';
import GlobalCommand from '../../api/GlobalCommand';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import Configuration, { CONFIGURATION_SERVICE } from '../service/ConfigurationService';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';
import GroupCommand from '../../api/GroupCommand';
import { ArgumentValueTypeName } from '../../api/ArgumentValueType';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';

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

function getGlobalCommandArgumentForm(argument: GlobalCommandArgument): string {
    let argumentSyntax;
    if (argument.type === ArgumentValueTypeName.Boolean) {
        argumentSyntax = 'true|false';
    } else {
        argumentSyntax = `<${argument.name}>`;
    }
    if (argument.isOptional || argument.type === ArgumentValueTypeName.Boolean) {
        argumentSyntax = `[${argumentSyntax}]`;
    }
    return argumentSyntax;
}

function getSubCommandArgumentsSyntax(subCommand: SubCommand): string {
    let syntax = '';

    subCommand.options.forEach((option) => {
        let optionSyntax = `--${option.name}`;
        if (option.type === ArgumentValueTypeName.Boolean) {
            optionSyntax = `${optionSyntax} [<value>]`;
        } else {
            optionSyntax = `${optionSyntax} <value>`;
        }
        if (option.isOptional || !_.isUndefined(option.defaultValue)) {
            optionSyntax = ` [${optionSyntax}]`;
        } else {
            optionSyntax = ` ${optionSyntax}`;
        }
        if (option.isArray) {
            optionSyntax = `${optionSyntax}...`;
        }
        syntax = `${syntax}${optionSyntax}`;
    });

    subCommand.positionals.forEach((positional) => {
        let positionalSyntax = `<${positional.name}>`;
        if (positional.isVarArgOptional) {
            positionalSyntax = ` [${positionalSyntax}]`;
        } else {
            positionalSyntax = ` ${positionalSyntax}`;
        }
        if (positional.isVarArgMultiple) {
            positionalSyntax = `${positionalSyntax}...`;
        }
        syntax = `${syntax}${positionalSyntax}`;
    });
    return syntax;
}

function getOptionHelpEntry(option: Option): HelpEntry {
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
        notes.push('(multiple values supported)');
    }
    return helpEntry;
}

function getPositionalHelpEntry(positional: Positional): HelpEntry {
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
        notes.push('(multiple values supported)');
    }
    return helpEntry;
}

function getGlobalArgumentHelpEntry(globalCommand: GlobalCommand): [string, string] {
    const { argument } = globalCommand;

    let argumentDescription = globalCommand.description || '';
    if (_.isUndefined(argument)) {
        return ['', argumentDescription];
    }
    const argumentSyntax = getGlobalCommandArgumentForm(argument);

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

function getCommandArgsAndExampleHelpSections(context: Context, subCommand: SubCommand,
    isSingleCommandApp: boolean): HelpSection[] {
    const helpSections: HelpSection[] = [];
    if (!_.isEmpty(subCommand.options) || !_.isEmpty(subCommand.positionals)) {
        const argumentsSection: HelpSection = {
            title: `${isSingleCommandApp ? 'Command ' : ''}Arguments`,
            entries: []
        };
        subCommand.options.forEach((option) => {
            argumentsSection.entries.push(getOptionHelpEntry(option));
        });
        subCommand.positionals.forEach((positional) => {
            argumentsSection.entries.push(getPositionalHelpEntry(positional));
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
                syntax: `$ ${context.cliConfig.name} ${subCommand.name} ${usageExample.exampleArguments}`
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

function getCommandAppSyntax(
    context: Context,
    globalModifierCommands: GlobalModifierCommand[],
    globalCommands: GlobalCommand[],
    groupCommands: GroupCommand[],
    subCommands: SubCommand[]
): string {
    const globalPrefix = ((groupCommands.length > 0) || (subCommands.length > 0)) ? 'global_' : '';
    let syntax = context.cliConfig.name || '';
    if (globalModifierCommands.length > 0) {
        syntax += ` [<${globalPrefix}option>`;
        // dont render global_option arg if none defined
        const noArg = globalModifierCommands.every((modifier) => _.isUndefined(modifier.argument));
        if (!noArg) {
            // render global_option arg in [] if all modifiers have non-optional, non-boolean arg with no default
            const optionArgMandatory = globalModifierCommands.every((modifier) => !_.isUndefined(modifier.argument)
                && !modifier.argument.isOptional
                && _.isUndefined(modifier.argument.defaultValue)
                && modifier.argument.type !== ArgumentValueTypeName.Boolean);
            syntax += optionArgMandatory ? ' <value>' : ' [<value>]';
        }
        syntax += ']';
    }
    if (globalModifierCommands.length > 1) {
        syntax += '...';
    }
    let arg = false;
    let argOptional = false;
    let argValueOptional = false;
    let multipleArg = false;
    const commandClauses = [];
    if (globalCommands.length > 0) {
        commandClauses.push(`<${globalPrefix}command>`);
        arg = globalCommands.some((globalCommand) => !_.isUndefined(globalCommand.argument));
        if (arg) {
            argOptional = globalCommands.some((globalCommand) => !_.isUndefined(globalCommand.argument)
                && ((!_.isUndefined(globalCommand.argument.isOptional)
                    && globalCommand.argument.isOptional) || !_.isUndefined(globalCommand.argument.defaultValue)));
            argValueOptional = globalCommands.some((globalCommand) =>
                !_.isUndefined(globalCommand.argument)
                && (globalCommand.argument.type === ArgumentValueTypeName.Boolean));
        }
    }
    if ((groupCommands.length > 0) || (subCommands.length > 0)) {
        commandClauses.push('<command>');
        arg = arg || groupCommands.some((groupCommand) =>
            groupCommand.memberSubCommands.some((memberCommand) =>
                memberCommand.options.length > 0 || memberCommand.positionals.length > 0))
            || subCommands.some((subCommand) =>
                subCommand.options.length > 0 || subCommand.positionals.length > 0);
        if (arg) {
            argOptional = argOptional || groupCommands.some((groupCommand) =>
                groupCommand.memberSubCommands.some((memberCommand) =>
                    memberCommand.options.some((option) =>
                        (!_.isUndefined(option.isOptional) && option.isOptional) || !_.isUndefined(option.defaultValue))
                        || memberCommand.positionals.some((positional) =>
                            (!_.isUndefined(positional.isVarArgOptional) && positional.isVarArgOptional))))
                || subCommands.some((subCommand) =>
                    subCommand.options.some((option) =>
                        (!_.isUndefined(option.isOptional) && option.isOptional)
                        || !_.isUndefined(option.defaultValue))
                    || subCommand.positionals.some((positional) =>
                        (!_.isUndefined(positional.isVarArgOptional) && positional.isVarArgOptional)));
            argValueOptional = argValueOptional || groupCommands.some((groupCommand) =>
                groupCommand.memberSubCommands.some((memberCommand) =>
                    memberCommand.options.some((option) => option.type === ArgumentValueTypeName.Boolean
                        || memberCommand.positionals.some((positional) =>
                            positional.type === ArgumentValueTypeName.Boolean))))
                || subCommands.some((subCommand) =>
                    subCommand.options.some((option) => option.type
                        === ArgumentValueTypeName.Boolean)
                    || subCommand.positionals.some((positional) =>
                        positional.type === ArgumentValueTypeName.Boolean));
            multipleArg = multipleArg || groupCommands.some((groupCommand) =>
                groupCommand.memberSubCommands.some((memberCommand) =>
                    memberCommand.options.some((option) => option.isArray)
                    || memberCommand.positionals.some((positional) => positional.isVarArgMultiple)))
                || subCommands.some((subCommand) =>
                    subCommand.options.some((option) => option.isArray)
                    || subCommand.positionals.some((positional) => positional.isVarArgMultiple));
        }
    }
    if (commandClauses.length > 0) {
        let subSyntax = `${commandClauses.join('|')}`;
        // dont render arg if none defined (no global arg or no option/positional)
        if (arg) {
            let argSyntax = '<arg>';
            // render arg value in [] if some are optional
            argSyntax += argValueOptional ? ' [<value>]' : ' <value>';
            // dont render arg in [] if none are optional and have no default
            // eslint-disable-next-line no-nested-ternary
            subSyntax += argOptional ? ` [${argSyntax}]` : multipleArg ? ` <${argSyntax}>` : ` ${argSyntax}`;
            // check to render multiple arg
            if (multipleArg) {
                subSyntax += '...';
            }
        }
        syntax += ` ${subSyntax}`;
    }
    return syntax;
}

function printHelpSections(printer: Printer, sections: HelpSection[]): void {

    const helpEntryIndent = ' '.repeat(SYNTAX_INDENT_WIDTH);

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
                printer.info(`${printer.dim(helpEntryIndent + entry.syntax + padding + entry.description)}`);
                notesIndent = SYNTAX_INDENT_WIDTH + entry.syntax.length + paddingCount;
            } else {
                printer.info(`${printer.dim(helpEntryIndent + entry.syntax)}`);
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

function checkContext(context: Context) {
    if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.name)) {
        throw new Error('Provided context is missing property: "cliConfig.name: string"');
    }
    if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.description)) {
        throw new Error('Provided context is missing property: "cliConfig.description: string"');
    }
    if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.version)) {
        throw new Error('Provided context is missing property: "cliConfig.version: string"');
    }
}

function getGenericHelpInitialSections(context: Context, stdoutPrinter: Printer): HelpSection[] {
    const helpSections: HelpSection[] = [];
    helpSections.push({
        title: stdoutPrinter.blue(context.cliConfig.description || ''),
        entries: [
            {
                syntax: 'version',
                description: context.cliConfig.version
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
    return helpSections;
}

/**
 * Provides common implementation for both [[MultiCommandHelpGlobalCommand]] and [[MultiCommandHelpSubCommand]].
 */
class MultiCommandCommonHelpCommand {

    readonly name = 'help';

    readonly description = 'Display application help';

    private findCommand(commandName: string, groupCommands: GroupCommand[], subCommands: SubCommand[]):
        [GroupCommand | undefined, SubCommand | undefined] {
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

    private getGlobalCommandsHelpSection(title: string, globalCommands: GlobalCommand[]): HelpSection {
        const globalCommandsSection: HelpSection = {
            title,
            entries: []
        };
        globalCommands.forEach((globalCommand) => {
            const [argumentSyntax, argumentDescription] = getGlobalArgumentHelpEntry(globalCommand);
            globalCommandsSection.entries.push({
                syntax: `--${globalCommand.name} ${argumentSyntax}`,
                description: argumentDescription
            });
            if (!_.isUndefined(globalCommand.shortAlias)) {
                globalCommandsSection.entries.push({
                    syntax: `-${globalCommand.shortAlias} ${argumentSyntax}`,
                    description: argumentDescription
                });
            }
        });
        globalCommandsSection.entries.sort((a, b) => a.syntax.localeCompare(b.syntax));
        return globalCommandsSection;
    }

    private getGenericHelpSections(
        globalModifierCommands: GlobalModifierCommand[],
        globalCommands: GlobalCommand[],
        groupCommands: GroupCommand[],
        subCommands: SubCommand[]
    ): HelpSection[] {

        const globalPrefix = ((groupCommands.length > 0) || (subCommands.length > 0)) ? 'Global ' : '';
        const helpSections: HelpSection[] = [];
        if (globalModifierCommands.length > 0) {
            helpSections.push(this.getGlobalCommandsHelpSection(`${globalPrefix}Options`, globalModifierCommands));
        }
        if (globalCommands.length > 0) {
            helpSections.push(this.getGlobalCommandsHelpSection(`${globalPrefix}Commands`, globalCommands));
        }
        groupCommands.forEach((groupCommand) => {
            const topicSection: HelpSection = {
                title: `${groupCommand.name.charAt(0).toUpperCase() + groupCommand.name.slice(1)} Commands`,
                entries: []
            };
            groupCommand.memberSubCommands.forEach((memberCommand) => {
                topicSection.entries.push({
                    syntax: `${groupCommand.name}:${memberCommand.name}`,
                    description: memberCommand.description
                });
            });
            topicSection.entries.sort((a, b) => a.syntax.localeCompare(b.syntax));
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
                    topicCommands.sort((a, b) => a.name.localeCompare(b.name));
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
                otherSubCommands.sort((a, b) => a.name.localeCompare(b.name));
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

    /**
     * Prints generic CLI help.
     *
     * If an implementation of [[Configuration]] is registered with the [[CONFIGURATION_SERVICE]] ID in the provided
     * [[Context]] it will be used to display the configuration location.
     *
     * @param context the [[Context]] in which to run.
     * @param stdoutPrinter the [[Printer]] implementation to use.
     */
    public printGenericHelp(context: Context, stdoutPrinter: Printer): void {

        const helpSections = getGenericHelpInitialSections(context, stdoutPrinter);
        const globalModifierCommands = Array.from(context.commandRegistry.getGlobalModifierCommands());
        const globalCommands = Array.from(context.commandRegistry.getGlobalCommands());
        const groupCommands = Array.from(context.commandRegistry.getGroupCommands());
        const subCommands = Array.from(context.commandRegistry.getSubCommands());
        helpSections.push({
            title: 'Usage',
            entries: [
                {
                    syntax: getCommandAppSyntax(context, globalModifierCommands, globalCommands, groupCommands,
                        subCommands)
                }
            ]
        });

        helpSections.push(
            ...this.getGenericHelpSections(globalModifierCommands, globalCommands, groupCommands, subCommands)
        );

        printHelpSections(stdoutPrinter, helpSections);
    }

    /**
     * Prints usage help for specified command.
     *
     * @param context the [[Context]] in which to run.
     * @param commandName name of the command for which to show help.
     * @param stdoutPrinter the [[Printer]] implementation to use.
     * @param stderrPrinter the [[Printer]] implementation to use.
     */
    public printUsageHelp(context: Context, commandName: string, stdoutPrinter: Printer, stderrPrinter: Printer): void {
        const groupCommands = Array.from(context.commandRegistry.getGroupCommands());
        const subCommands = Array.from(context.commandRegistry.getSubCommands());

        // find sub-command or group sub-command
        const [groupCommand, subCommand] = this.findCommand(commandName, groupCommands, subCommands);

        if (_.isUndefined(subCommand)) {

            stderrPrinter.error(`Unknown command: ${stderrPrinter.red(commandName)}\n`, Icon.FAILURE);

            // look for other possible matches
            const possibleCommandNames = this.findPossibleCommandNames(commandName, groupCommands, subCommands);
            if (!_.isEmpty(possibleCommandNames)) {
                stderrPrinter.info(`Possible matches: ${possibleCommandNames.join(', ')}\n`, Icon.INFORMATION);
            }
            this.printGenericHelp(context, stdoutPrinter);
            return;
        }

        // display command help
        const name = _.isUndefined(groupCommand) ? subCommand.name : `${groupCommand.name}:${subCommand.name}`;
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
                syntax: `${context.cliConfig.name}${name.length > 0 ? ` ${name}` : ''}${
                    getSubCommandArgumentsSyntax(subCommand)}`
            }]
        });

        helpSections.push(
            ...getCommandArgsAndExampleHelpSections(context, subCommand, false)
        );
        printHelpSections(stdoutPrinter, helpSections);
    }

    /**
     * @inheritdoc
     *
     * Prints CLI help. Expects implementation of [[Printer]] registered with the
     * [[STDOUT_PRINTER_SERVICE]] and [[STDERR_PRINTER_SERVICE]] ID in the provided [[Context]].
     */
    public run(commandArgs: CommandArgs, context: Context): void {

        checkContext(context);
        const stdoutPrinter = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!stdoutPrinter) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        const stderrPrinter = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (!stderrPrinter) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        if (_.isUndefined(commandArgs.command)) {
            this.printGenericHelp(context, stdoutPrinter);
        } else {
            this.printUsageHelp(context, commandArgs.command as string, stdoutPrinter, stderrPrinter);
        }
    }
}

/**
 * Implementation of CLI help available via either *--help* or *-h* which supports a multiple command CLI.
 */
export class MultiCommandHelpGlobalCommand extends MultiCommandCommonHelpCommand implements GlobalCommand {

    readonly shortAlias = 'h';

    readonly argument = {
        name: 'command',
        isOptional: true
    };
}

/**
 * Implementation of CLI help available via *help* which supports a multiple command CLI.
 */
export class MultiCommandHelpSubCommand extends MultiCommandCommonHelpCommand implements SubCommand {

    public readonly options: ReadonlyArray<Option> = [];

    public readonly positionals: ReadonlyArray<Positional> = [
        {
            name: 'command',
            isVarArgOptional: true,
            description: 'Display help for the specific <command>'
        }
    ];
}

/**
 * Provides common implementation for both [[SingleCommandHelpGlobalCommand]] and [[SingleCommandHelpSubCommand]].
 */
class SingleCommandCommonHelpCommand {

    public defaultCommand: SubCommand | undefined;

    readonly name = 'help';

    readonly description = 'Display application help';

    private getAmalgamatedGenericHelpSection(
        globalModifierCommands: GlobalModifierCommand[],
        globalCommands: GlobalCommand[],
        groupCommands: GroupCommand[],
        subCommands: SubCommand[]
    ): HelpSection {

        const helpSection: HelpSection = {
            title: 'Other Arguments',
            entries: []
        };
        if (globalModifierCommands.length > 0) {
            globalModifierCommands.forEach((globalModifierCommand) => {
                const [argumentSyntax, argumentDescription] = getGlobalArgumentHelpEntry(globalModifierCommand);
                helpSection.entries.push({
                    syntax: `--${globalModifierCommand.name} ${argumentSyntax}`,
                    description: argumentDescription
                });
                if (!_.isUndefined(globalModifierCommand.shortAlias)) {
                    helpSection.entries.push({
                        syntax: `-${globalModifierCommand.shortAlias} ${argumentSyntax}`,
                        description: argumentDescription
                    });
                }
            });
        }
        if (globalCommands.length > 0) {
            globalCommands.forEach((globalCommand) => {
                const [argumentSyntax, argumentDescription] = getGlobalArgumentHelpEntry(globalCommand);
                helpSection.entries.push({
                    syntax: `--${globalCommand.name} ${argumentSyntax}`,
                    description: argumentDescription
                });
                if (!_.isUndefined(globalCommand.shortAlias)) {
                    helpSection.entries.push({
                        syntax: `-${globalCommand.shortAlias} ${argumentSyntax}`,
                        description: argumentDescription
                    });
                }
            });
        }
        groupCommands.forEach((groupCommand) => {
            groupCommand.memberSubCommands.forEach((memberCommand) => {
                helpSection.entries.push({
                    syntax: `${groupCommand.name}:${memberCommand.name}`,
                    description: memberCommand.description
                });
            });
        });
        if (subCommands.length > 0) {
            subCommands.forEach((subCommand) => {
                helpSection.entries.push({
                    syntax: subCommand.name,
                    description: subCommand.description
                });
            });
        }
        helpSection.entries.sort((a, b) => a.syntax.localeCompare(b.syntax));
        return helpSection;
    }

    /**
     * Prints generic CLI help.
     *
     * If an implementation of [[Configuration]] is registered with the [[CONFIGURATION_SERVICE]] ID in the provided
     * [[Context]] it will be used to display the configuration location.
     *
     * @param context the [[Context]] in which to run.
     * @param stdoutPrinter the [[Printer]] implementation to use.
     */
    public printGenericHelp(context: Context, stdoutPrinter: Printer): void {
        if (!this.defaultCommand) {
            throw new Error('defaultCommand property must be set before invoking run()!');
        }

        const helpSections = getGenericHelpInitialSections(context, stdoutPrinter);
        helpSections.push({
            title: 'Usage',
            entries: [{
                syntax: `${context.cliConfig.name || ''}${getSubCommandArgumentsSyntax(this.defaultCommand)}`
            }]
        });

        helpSections.push(
            ...getCommandArgsAndExampleHelpSections(context, this.defaultCommand, true)
        );

        const globalModifierCommands = Array.from(context.commandRegistry.getGlobalModifierCommands());
        const globalCommands = Array.from(context.commandRegistry.getGlobalCommands());
        const groupCommands = Array.from(context.commandRegistry.getGroupCommands());
        const subCommands = Array.from(context.commandRegistry.getSubCommands());
        helpSections.push(
            this.getAmalgamatedGenericHelpSection(globalModifierCommands, globalCommands, groupCommands, subCommands)
        );

        printHelpSections(stdoutPrinter, helpSections);
    }

    /**
     * @inheritdoc
     *
     * Prints CLI help. Expects implementation of [[Printer]] registered with the
     * [[STDOUT_PRINTER_SERVICE]] ID in the provided [[Context]].
     */
    public run(commandArgs: CommandArgs, context: Context): void {

        checkContext(context);
        const stdoutPrinter = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!stdoutPrinter) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }

        this.printGenericHelp(context, stdoutPrinter);
    }
}

/**
 * Implementation of CLI help available via either *--help* or *-h* which supports a single default command CLI.
 */
export class SingleCommandHelpGlobalCommand extends SingleCommandCommonHelpCommand implements GlobalCommand {

    readonly shortAlias = 'h';
}

/**
 * Implementation of CLI help available via *help* which supports a single default command CLI.
 */
export class SingleCommandHelpSubCommand extends SingleCommandCommonHelpCommand implements SubCommand {

    public readonly options: ReadonlyArray<Option> = [];

    public readonly positionals: ReadonlyArray<Positional> = [];
}
