/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable no-continue */

import _ from 'lodash';
import debug from 'debug';
import Command, { CommandArgs } from '../../api/Command';
import populateSubCommandValues from './populateSubCommandValues';
import populateGlobalCommandValue from './populateGlobalCommandValue';
import {
    validateGlobalCommandArgumentValue,
    validateOptionValue,
    validatePositionalValue
} from './ArgumentValueValidation';
import Parser, {
    CommandClause,
    InvalidArg,
    ParseResult,
    ScanResult
} from '../../api/Parser';
import {
    isGlobalCommand,
    isGlobalModifierCommand,
    isSubCommand
} from '../../api/CommandTypeGuards';
import CommandRegistry from '../../api/CommandRegistry';
import GroupCommand from '../../api/GroupCommand';

/**
 * A container holding the result of a single scanning operation.
 */
export interface LocalScanResult {

    /**
     * Result from a scan operation.
     */
    commandClause?: CommandClause;

    /**
     * Any arguments which were unused in the scanning operation. As the scanning starts at the beginning of the
     * provided args looking for a [[Command]] name or alias, this will effectively be any leading arguments before
     * the [[Command]] was found, or all args if no [[Command]] was found.
     */
    unusedLeadingArgs: string[];
}

/**
 * Default implementation of a [[Parser]].
 */
export default class DefaultParser implements Parser {

    private readonly log: debug.Debugger = debug('DefaultParser');

    private commandRegistry: CommandRegistry | undefined;

    private readonly groupAndMemberCommandsByJoinedNames: Map<string, [GroupCommand, Command]> = new Map();

    /**
     * @inheritdoc
     */
    public setCommandRegistry(commandRegistry: CommandRegistry): void {
        this.commandRegistry = commandRegistry;

        for (const groupCommand of this.commandRegistry.getGroupCommands()) {
            groupCommand.memberSubCommands.forEach((memberSubCommand) => {
                this.groupAndMemberCommandsByJoinedNames.set(groupCommand.name + memberSubCommand.name, [
                    groupCommand, memberSubCommand
                ]);
            });
        }
    }

    private scanForNextCommandArg(potentialArgs: string[], greedy: boolean): LocalScanResult {

        this.log(`${greedy ? 'Greedy' : 'Lazy'} scanning for next command: ${potentialArgs.join(' ')}`);

        let pendingArgs = [...potentialArgs];
        const unusedLeadingArgs: string[] = [];

        while (pendingArgs.length > 0) {
            const arg = pendingArgs[0];
            pendingArgs = pendingArgs.slice(1);

            if (!arg.startsWith('-') && !greedy) {
                // could be <group_command_name>:<member_sub_command_name> or
                // <group_command_name> <member_sub_command_name> or
                // <sub_command_name>
                let potentialGroupCommandName = arg;

                let potentialMemberCommandName;
                if (potentialGroupCommandName.includes(':')) {
                    // look for <group_command_name>:<member_sub_command_name>
                    [potentialGroupCommandName, potentialMemberCommandName] = potentialGroupCommandName.split(':');
                } else if (pendingArgs.length > 0) {
                    // look for <group_command_name> <member_sub_command_name>
                    [potentialMemberCommandName] = pendingArgs;
                    pendingArgs = pendingArgs.slice(1);
                }
                if (!_.isUndefined(potentialMemberCommandName)) {

                    const joinedNames = potentialGroupCommandName + potentialMemberCommandName;
                    const tuple = this.groupAndMemberCommandsByJoinedNames.get(joinedNames);
                    if (tuple) {
                        const [groupCommand, memberCommand] = tuple;
                        if (groupCommand) {
                            this.log(`Found group command name: ${potentialGroupCommandName}`
                                + ` and member sub-command name: ${potentialMemberCommandName}`);

                            return {
                                commandClause: {
                                    groupCommand,
                                    command: memberCommand,
                                    potentialArgs: pendingArgs
                                },
                                unusedLeadingArgs
                            };
                        }
                    }
                }
                if (!arg.includes(':') && !_.isUndefined(potentialMemberCommandName)) {
                    // group command not found revert parsing state
                    pendingArgs.unshift(potentialMemberCommandName);
                }

                // could be <sub_command_name>
                if (this.commandRegistry === undefined) {
                    throw new Error('commandRegistry is undefined, has setCommandRegistry() been invoked?');
                }
                const command = this.commandRegistry.getSubCommandByName(arg);

                if (command) {
                    this.log(`Found sub-command name: ${arg}`);

                    return {
                        commandClause: {
                            command,
                            potentialArgs: pendingArgs
                        },
                        unusedLeadingArgs
                    };
                }
            } else if (arg.startsWith('--')) {
                // could be <global_modifier_command_name> or <global_command_name>
                const potentialGlobalCommandName = arg.slice(2);

                // eslint-disable-next-line max-len,@typescript-eslint/no-non-null-assertion
                const command = this.commandRegistry!.getGlobalOrGlobalModifierCommandByName(potentialGlobalCommandName);
                if (command) {
                    if (!greedy || isGlobalModifierCommand(command)) {
                        this.log(`Found global command name: ${potentialGlobalCommandName}`);
                        return {
                            commandClause: {
                                command,
                                potentialArgs: pendingArgs
                            },
                            unusedLeadingArgs
                        };
                    }
                    this.log(`Skipping global command name: ${potentialGlobalCommandName} as mot greedy`);
                }
            }
            unusedLeadingArgs.push(arg);
        }
        return {
            unusedLeadingArgs
        };
    }

    /**
     * @inheritdoc
     */
    public scanForCommandClauses(args: string[]): ScanResult {

        if (!this.commandRegistry) {
            throw new Error('CommandRegistry has not been set!');
        }

        this.log('Normalising global command arguments: mapping from short alias to name and removing =');

        // expand global args
        const potentialArgs: string[] = [];

        for (const arg of args) {

            // only looking for --<global_command_name> or -<global_command_short_alias>
            if (!arg.startsWith('-')) {
                potentialArgs.push(arg);
                // eslint-disable-next-line no-continue
                continue;
            }

            if (arg.startsWith('--')) {
                // potential <global_command_name>
                let potentialGlobalCommandName = arg.slice(2);

                // look for <global_command_name>=<value>
                let nextArg;
                if (potentialGlobalCommandName.includes('=')) {
                    [potentialGlobalCommandName, nextArg] = potentialGlobalCommandName.split(/=(.*)/);
                }

                // check if this is a global command name
                if (!this.commandRegistry.getGlobalOrGlobalModifierCommandByName(potentialGlobalCommandName)) {
                    potentialArgs.push(arg);
                    // eslint-disable-next-line no-continue
                    continue;
                }

                this.log(`Found global command name: ${potentialGlobalCommandName}`);
                potentialArgs.push(`--${potentialGlobalCommandName}`);

                // keep the value split from <global_command_short_alias>=<value>
                if (!_.isUndefined(nextArg)) {
                    potentialArgs.push(nextArg);
                }
            } else {
                // potential <global_command_short_alias>
                let potentialGlobalCommandShortAlias = arg.slice(1);

                // look for <global_command_short_alias>=<value>
                let nextArg;
                if (potentialGlobalCommandShortAlias.includes('=')) {
                    [potentialGlobalCommandShortAlias, nextArg] = potentialGlobalCommandShortAlias.split(/=(.*)/);
                }

                // check if this is a global command short alias
                // eslint-disable-next-line max-len
                if (!this.commandRegistry.getGlobalOrGlobalModifierCommandByShortAlias(potentialGlobalCommandShortAlias)) {
                    potentialArgs.push(arg);
                    // eslint-disable-next-line no-continue
                    continue;
                }

                this.log(`Found global command short alias: ${potentialGlobalCommandShortAlias}`);
                // eslint-disable-next-line max-len,@typescript-eslint/no-non-null-assertion
                potentialArgs.push(`--${this.commandRegistry.getGlobalOrGlobalModifierCommandByShortAlias(potentialGlobalCommandShortAlias)!.name}`);

                // keep the value split from <global_command_short_alias>=<value>
                if (!_.isUndefined(nextArg)) {
                    potentialArgs.push(nextArg);
                }
            }
        }
        this.log(`Normalised args: ${potentialArgs.join(' ')}`);

        const scanResult: ScanResult = {
            commandClauses: [],
            unusedLeadingArgs: []
        };

        // scan the set of arguments for the first command
        let localScanResult: LocalScanResult;

        // start by looking for any command type in the arguments i.e. greedy = false
        localScanResult = this.scanForNextCommandArg(potentialArgs, false);

        // keep a note of any leading unused arguments
        scanResult.unusedLeadingArgs = localScanResult.unusedLeadingArgs;

        // found the first command
        if (localScanResult.commandClause) {
            scanResult.commandClauses.push(localScanResult.commandClause);

            // save as the last command clause
            let lastCommandClause = localScanResult.commandClause;

            // while we still have args to scan for commands
            while (lastCommandClause.potentialArgs.length > 0) {

                // scan for next command
                // look for any command type in the arguments unless current command is non-modifier
                const greedy = !isGlobalModifierCommand(lastCommandClause.command);
                localScanResult = this.scanForNextCommandArg(lastCommandClause.potentialArgs, greedy);

                // args that weren't used in the current scan are provided to the previous command
                lastCommandClause.potentialArgs = localScanResult.unusedLeadingArgs;

                // found the next command
                if (localScanResult.commandClause) {
                    scanResult.commandClauses.push(localScanResult.commandClause);

                    // save as the last command clause
                    lastCommandClause = localScanResult.commandClause;
                } else {
                    break;
                }
            }
        }

        this.log(`scanResult: {clauses: [${
            scanResult.commandClauses.map(
                (clause) => {
                    let entry = `command: ${clause.command.name}`;
                    if (clause.groupCommand) {
                        entry = `groupCommand: ${clause.groupCommand.name}, ${entry}`;
                    }
                    return `${entry}, unused: ${clause.potentialArgs.join(',')}`;
                }
            ).join(', ')
        }], unused: ${
            scanResult.unusedLeadingArgs.join(',')
        }}`);
        return scanResult;
    }

    /**
     * @inheritdoc
     */
    public parseCommandClause(commandClause: CommandClause, config?: CommandArgs): ParseResult {

        const { groupCommand, command, potentialArgs } = commandClause;

        const invalidArgs: InvalidArg[] = [];

        if (isSubCommand(command)) {
            // eslint-disable-next-line prefer-const
            let { commandArgs, unusedArgs } = populateSubCommandValues(command, potentialArgs, invalidArgs);

            // merge in config defaults
            if (!_.isUndefined(config)) {
                commandArgs = _.merge(commandArgs, config);
            }

            command.options.forEach((option) => {
                const validatedValue = validateOptionValue(option, commandArgs[option.name], invalidArgs);
                if (validatedValue) {
                    commandArgs[option.name] = validatedValue;
                } else {
                    delete commandArgs[option.name];
                }
            });

            this.log(`Command arguments after options validated: ${JSON.stringify(commandArgs)}`
                + ` with ${invalidArgs.length} invalid args`);

            command.positionals.forEach((positional) => {
                const validatedValue = validatePositionalValue(positional, commandArgs[positional.name],
                    invalidArgs);
                if (validatedValue) {
                    commandArgs[positional.name] = validatedValue;
                } else {
                    delete commandArgs[positional.name];
                }
            });

            this.log(`Command arguments after positionals validated: ${JSON.stringify(commandArgs)}`
                + ` with ${invalidArgs.length} invalid args`);

            return {
                command,
                groupCommand,
                commandArgs,
                invalidArgs,
                unusedArgs
            };
        }
        if (isGlobalCommand(command) || isGlobalModifierCommand(command)) {
            // eslint-disable-next-line prefer-const
            let { commandArgs, unusedArgs } = populateGlobalCommandValue(command, potentialArgs, invalidArgs);

            // merge in config defaults
            if (!_.isUndefined(config)) {
                commandArgs = _.merge(commandArgs, config);
            }

            if (command.argument) {
                const validatedValue = validateGlobalCommandArgumentValue(command.argument,
                    commandArgs[command.argument.name], invalidArgs);
                if (validatedValue) {
                    commandArgs[command.argument.name] = validatedValue;
                } else {
                    delete commandArgs[command.argument.name];
                }
            }

            this.log(`Command arguments for command ${command.name} after value validated: `
                + `${JSON.stringify(commandArgs)} with ${invalidArgs.length} invalid args`);

            return {
                command,
                commandArgs,
                invalidArgs,
                unusedArgs
            };
        }
        throw new Error('Unknown command type in logic');
    }
}
