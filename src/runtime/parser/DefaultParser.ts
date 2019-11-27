/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import Command from '../../api/Command';
import populateArguments from './ArgumentsPopulation';
import { validateOptionValue, validatePositionalValue } from './ArgumentsValidation';
import Parser, {
    CommandClause,
    InvalidArg,
    ParseResult,
    ScanResult
} from './Parser';

/**
 * A container holding the result of a single scanning operation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export interface LocalScanResult<S_ID> {

    /**
     * Result from a scan operation.
     */
    commandClause?: CommandClause<S_ID>;

    /**
     * Any arguments which were unused in the scanning operation. As the scanning starts at the beginning of the
     * provided args looking for a [[Command]] name or alias, this will effectively be any leading arguments before
     * the [[Command]] was found, or all args if no [[Command]] was found.
     */
    unusedLeadingArgs: string[];
}

/**
 * Default implementation of a [[Parser]].
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default class DefaultParser<S_ID> implements Parser<S_ID> {

    private readonly log: debug.Debugger = debug('DefaultParser');

    private readonly commandsByNameOrAlias: Map<string, Command<S_ID>> = new Map();

    private readonly globalCommandNamesAndAliases: string[] = [];

    private readonly allCommandNamesAndAliases: string[] = [];

    /**
     * @inheritdoc
     */
    public setCommands(commands: Command<S_ID>[]): void {

        commands.forEach((command) => {

            // add to map for name and each alias
            this.commandsByNameOrAlias.set(command.name, command);
            if (command.aliases) {
                command.aliases.forEach((alias) => {
                    this.commandsByNameOrAlias.set(alias, command);
                });
            }

            // global commands
            if (command.isGlobal) {
                this.globalCommandNamesAndAliases.push(command.name);
                this.globalCommandNamesAndAliases.push(...command.aliases || []);
            }

            // all commands
            this.allCommandNamesAndAliases.push(command.name);
            this.allCommandNamesAndAliases.push(...command.aliases || []);
        });
    }

    private scanForNextCommandArg(potentialArgs: string[]): LocalScanResult<S_ID> {

        this.log(`Scanning for next command: ${potentialArgs.join(' ')}`);

        let pendingArgs = [...potentialArgs];
        const unusedLeadingArgs: string[] = [];

        while (pendingArgs.length > 0) {
            const arg = pendingArgs[0];
            pendingArgs = pendingArgs.slice(1);

            if (!arg.startsWith('-') && this.allCommandNamesAndAliases.includes(arg)) {

                const command = this.commandsByNameOrAlias.get(arg);

                if (command) {
                    this.log(`Found command name or alias: ${arg}`);

                    return {
                        commandClause: {
                            command,
                            potentialArgs: pendingArgs
                        },
                        unusedLeadingArgs
                    };
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
    public scanForCommandClauses(args: string[]): ScanResult<S_ID> {

        this.log('Normalising global and global qualifier options...');

        // expand global args
        const potentialArgs: string[] = [];

        args.forEach((arg) => {
            if (arg.startsWith('--')) {
                let potentialCommandName = arg.slice(2);

                // support --qualifier.command.name=first-positional-arg
                let nextArg;
                if (potentialCommandName.includes('=')) {
                    [potentialCommandName, nextArg] = potentialCommandName.split('=');
                }

                if (this.globalCommandNamesAndAliases.includes(potentialCommandName)) {

                    this.log(`Found global command name: ${potentialCommandName}`);
                    potentialArgs.push(potentialCommandName);

                    if (nextArg !== undefined) {
                        potentialArgs.push(nextArg);
                    }
                } else {
                    potentialArgs.push(arg);
                }
            } else {
                potentialArgs.push(arg);
            }
        });
        this.log(`Normalised args: ${potentialArgs.join(' ')}`);

        const scanResult: ScanResult<S_ID> = {
            commandClauses: [],
            unusedLeadingArgs: []
        };

        // scan the set of arguments for the first command
        let localScanResult: LocalScanResult<S_ID>;

        localScanResult = this.scanForNextCommandArg(potentialArgs);

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
                localScanResult = this.scanForNextCommandArg(lastCommandClause.potentialArgs);

                // args that wasn't used in the current scan are provided to the previous command
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

        return scanResult;
    }

    /**
     * @inheritdoc
     */
    public parseCommandClause(commandClause: CommandClause<S_ID>): ParseResult<S_ID> {

        const { command, potentialArgs } = commandClause;

        const invalidArgs: InvalidArg[] = [];

        const { commandArgs, unusedArgs } = populateArguments(command, potentialArgs, invalidArgs);

        // TODO: merge in config defaults

        if (command.options) {
            command.options.forEach((option) => {
                const validatedValue = validateOptionValue(option, commandArgs[option.name], invalidArgs);
                if (validatedValue) {
                    commandArgs[option.name] = validatedValue;
                } else {
                    delete commandArgs[option.name];
                }
            });
        }

        this.log(`Command arguments after options validated: ${JSON.stringify(commandArgs)}`
            + ` with ${invalidArgs.length} invalid args`);

        if (command.positionals) {
            command.positionals.forEach((positional) => {
                const validatedValue = validatePositionalValue(positional, commandArgs[positional.name], invalidArgs);
                if (validatedValue) {
                    commandArgs[positional.name] = validatedValue;
                } else {
                    delete commandArgs[positional.name];
                }
            });
        }

        this.log(`Command arguments after positionals validated: ${JSON.stringify(commandArgs)}`
            + ` with ${invalidArgs.length} invalid args`);

        return {
            command,
            commandArgs,
            invalidArgs,
            unusedArgs
        };
    }
}
