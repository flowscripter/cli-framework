/**
 * @module @flowscripter/cli-framework-api
 */

import Command, { CommandArgs } from './Command';
import { ArgumentValueType } from './ArgumentValueType';
import GroupCommand from './GroupCommand';

/**
 * Possible reasons for an invalid argument
 */
export enum InvalidReason {

    /**
     * The argument value was not specified
     */
    MissingValue = 'MISSING_VALUE',

    /**
     * The argument does not support multiple values
     */
    IllegalMultipleValues = 'ILLEGAL_MULTIPLE_VALUES',

    /**
     * The value specified was not the correct type for the argument
     */
    IncorrectType = 'INCORRECT_TYPE',

    /**
     * The value specified was not one of the valid values for the argument
     */
    IllegalValue = 'ILLEGAL_VALUE'
}

/**
 * A container holding the details of an invalid argument which caused a parsing error
 */
export interface InvalidArg {

    /**
     * The name of the argument (if it was able to be populated)
     */
    readonly name?: string;

    /**
     * The argument value (if it was able to be populated)
     */
    readonly value?: ArgumentValueType;

    /**
     * A reason for the parsing error
     */
    readonly reason: InvalidReason;
}

/**
 * A single scan result holding a discovered [[Command]] and its potential arguments.
 */
export interface CommandClause {

    /**
     * Optional parent [[GroupCommand]] discovered as an argument if the discovered command was a member [[SubCommand]]
     */
    groupCommand?: GroupCommand;

    /**
     * The [[Command]] discovered as an argument
     */
    command: Command;

    /**
     * The potential arguments for the discovered [[Command]] up to the next discovered [[CommandClause]]
     */
    potentialArgs: string[];
}

/**
 * A container holding the result of a scanning operation.
 */
export interface ScanResult {

    /**
     * Array of results from a scan operation.
     */
    commandClauses: CommandClause[];

    /**
     * Any arguments which were unused in the scanning operation. As the scanning starts at the beginning of the
     * provided args looking for a [[Command]] name or alias, this will effectively be any leading arguments before
     * the first [[Command]] is found.
     */
    unusedLeadingArgs: string[];
}

/**
 * A container holding the result of a [[CommandClause]] parsing operation.
 */
export interface ParseResult {

    /**
     * Optional parent [[GroupCommand]] discovered as an argument if the discovered command was a member [[SubCommand]]
     */
    groupCommand?: GroupCommand;

    /**
     * The [[Command]] to run (if [[invalidArgs]] is empty)
     */
    readonly command: Command;

    /**
     * The arguments to provide the [[Command]] with when run (if [[invalidArgs]] is empty)
     */
    readonly commandArgs: CommandArgs;

    /**
     * Any arguments which were invalid
     */
    readonly invalidArgs: InvalidArg[];

    /**
     * Any remaining arguments which were unused in the parsing operation
     */
    readonly unusedArgs: string[];
}

/**
 * Interface to be implemented by a [[Parser]] allowing a [[Runner] to segment arguments into clauses based on
 * known [[Command]] names (and short aliases if [[GlobalCommand]]), then parse the arguments for
 * each [[Command]] clause.
 */
export default interface Parser {

    /**
     * Set the list of [[Command]] instances to be used when scanning and parsing for commands and arguments.
     *
     * @param commands the known [[Command]] instances to use
     */
    setCommands(commands: Command[]): void;

    /**
     * Scan the provided arguments and segment them into clauses demarcated by [[Command]] names and aliases.
     *
     * @param args the arguments to scan
     *
     * @return the results of the scanning operation
     */
    scanForCommandClauses(args: string[]): ScanResult;

    /**
     * Parse the [[Command]] arguments for the specified [[CommandClause]].
     *
     * @param commandClause the [[Command]] with its potential arguments to parse
     * @param config optional configuration object in the form of [[CommandArgs]] to initialise command arguments
     * before parsing
     *
     * @return the results of the parsing operation
     */
    parseCommandClause(commandClause: CommandClause, config?: CommandArgs): ParseResult;
}
