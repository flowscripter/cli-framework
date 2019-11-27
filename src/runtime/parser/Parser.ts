/**
 * @module @flowscripter/cli-framework
 */

import Command, { CommandArgs } from '../../api/Command';

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
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export interface CommandClause<S_ID> {

    /**
     * The [[Command]] discovered as an argument
     */
    command: Command<S_ID>;

    /**
     * The potential arguments for the discovered [[Command]] up to the next discovered [[CommandClause]]
     */
    potentialArgs: string[];
}

/**
 * A container holding the result of a scanning operation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export interface ScanResult<S_ID> {

    /**
     * Array of results from a scan operation.
     */
    commandClauses: CommandClause<S_ID>[];

    /**
     * Any arguments which were unused in the scanning operation. As the scanning starts at the beginning of the
     * provided args looking for a [[Command]] name or alias, this will effectively be any leading arguments before
     * the first [[Command]] is found.
     */
    unusedLeadingArgs: string[];
}

/**
 * A container holding the result of a [[CommandClause]] parsing operation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export interface ParseResult<S_ID> {

    /**
     * The [[Command]] to run (if there are no [[invalidArgs]] set)
     */
    readonly command: Command<S_ID>;

    /**
     * The arguments to provide the [[Command]] with when run (if there are no [[invalidArgs]] set)
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
 * known [[Command]] names and aliases then parse the arguments for each [[Command]] clause.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Parser<S_ID> {

    /**
     * Set the list of [[Command]] instances to be used when scanning and parsing for commands and arguments.
     *
     * @param commands the known [[Command]] instances to use
     */
    setCommands(commands: Command<S_ID>[]): void;

    /**
     * Scan the provided arguments and segment them into clauses demarcated by [[Command]] names and aliases.
     *
     * @param args the arguments to scan
     *
     * @return the results of the scanning operation
     */
    scanForCommandClauses(args: string[]): ScanResult<S_ID>;

    /**
     * Parse the [[Command]] arguments for the specified [[CommandClause]].
     *
     * @param commandClause the [[Command]] with its potential arguments to parse
     *
     * @return the results of the parsing
     */
    parseCommandClause(commandClause: CommandClause<S_ID>): ParseResult<S_ID>;
}
