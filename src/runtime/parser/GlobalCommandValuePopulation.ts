/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable no-continue */

import _ from 'lodash';
import debug from 'debug';
import { CommandArgs } from '../../api/Command';
import { InvalidArg, InvalidReason } from '../../api/Parser';
import { ArgumentSingleValueType, ArgumentValueType, ArgumentValueTypeName } from '../../api/ArgumentValueType';
import GlobalCommand from '../../api/GlobalCommand';
import { PopulateResult } from './PopulateResult';

const log: debug.Debugger = debug('GlobalCommandValuePopulation');

/**
 * Parse states for parsing loop logic
 */
enum ParseState {

    /**
     * Expecting a [[GlobalCommandArgument]] name next
     */
    Empty = 'EMPTY',

    /**
     * Found a [[GlobalCommandArgument]] name, now expecting a [[GlobalCommandArgument]] value next
     */
    GlobalCommandArgumentNameFound = 'GLOBAL_COMMAND_ARGUMENT_NAME_FOUND',

    /**
     * Found a [[GlobalCommandArgument]] name and value, flushing the remaining args
     */
    GlobalCommandArgumentNameAndValueFound = 'GLOBAL_COMMAND_ARGUMENT_NAME_AND_VALUE_FOUND',

    /**
     * Unexpected [[GlobalCommandArgument]] name found, flushing the remaining args
     */
    UnexpectedArgumentFound = 'UNEXPECTED_ARGUMENT_FOUND'
}

/**
 * Context container for the state of the parsing loop
 */
class ParseContext {

    constructor(state: ParseState = ParseState.Empty) {
        this.state = state;
    }

    /**
     * Parse state
     */
    state: ParseState;

    /**
     * Name of argument
     */
    name?: string;

    /**
     * Value of argument
     */
    value?: string | string[];
}

/**
 * Possible types of [[ParseEvent]] instances yielded from the parsing loop
 */
enum ParseEventType {

    /**
     * Unused arg
     */
    Unused = 'UNUSED',

    /**
     * Parsing had an error
     */
    Error = 'ERROR',

    /**
     * A [[GlobalCommandArgument]] was successfully populated
     */
    GlobalCommandArgumentSuccess = 'GLOBAL_COMMAND_ARGUMENT_SUCCESS'
}

/**
 * A container holding an event yielded from the parsing loop
 */
interface ParseEvent {

    /**
     * The type of the event
     */
    readonly type: ParseEventType;

    /**
     * The name of an argument i.e. [[type]] is GlobalCommandArgumentSuccess
     */
    readonly name?: string;

    /**
     * The value of an argument i.e. [[type]] is GlobalCommandArgumentSuccess
     */
    readonly value?: string | string[];

    /**
     * Parse error i.e. [[type]] is Error
     */
    readonly error?: InvalidReason;

    /**
     * An arg which was not used i.e. [[type]] is Unused
     */
    readonly unusedArg?: string;
}

function* flushParseContext(parseContext: ParseContext, type: ArgumentValueTypeName): Iterable<ParseEvent> {
    switch (parseContext.state) {
    case ParseState.Empty:
        return;
    case ParseState.GlobalCommandArgumentNameFound:
        if ((type === ArgumentValueTypeName.Boolean) && _.isUndefined(parseContext.value)) {
            // set implicit value of true
            yield {
                type: ParseEventType.GlobalCommandArgumentSuccess,
                name: parseContext.name,
                value: 'true'
            };
            return;
        }
        yield {
            type: ParseEventType.Error,
            name: parseContext.name,
            error: InvalidReason.MissingValue
        };
        return;
    case ParseState.GlobalCommandArgumentNameAndValueFound:

        // check for illegal syntax e.g. --optionName=
        if (!parseContext.value) {
            yield {
                type: ParseEventType.Error,
                name: parseContext.name,
                error: InvalidReason.MissingValue
            };
            return;
        }
        yield {
            type: ParseEventType.GlobalCommandArgumentSuccess,
            name: parseContext.name,
            value: parseContext.value
        };
        return;
    default:
        throw new Error(`Unexpected ParseState in logic: ${parseContext.state}`);
    }
}

function resetParseContext(parseContext: ParseContext): void {
    // eslint-disable-next-line no-param-reassign
    parseContext.state = ParseState.Empty;
    // eslint-disable-next-line no-param-reassign
    delete parseContext.name;
    // eslint-disable-next-line no-param-reassign
    delete parseContext.value;
}

function parsePotentialGlobalCommandArgument(potentialArg: string, commandName: string,
    commandShortAlias: string | undefined): ParseContext {

    const newParseContext = new ParseContext();

    if (!potentialArg.startsWith('-')) {
        return newParseContext;
    }
    newParseContext.state = ParseState.GlobalCommandArgumentNameFound;

    if (potentialArg.startsWith('--')) {
        newParseContext.name = potentialArg.slice(2);
        if (newParseContext.name.includes('=')) {
            [newParseContext.name, newParseContext.value] = newParseContext.name.split('=');
            newParseContext.state = ParseState.GlobalCommandArgumentNameAndValueFound;
        }
        // check argument name
        if (newParseContext.name !== commandName) {
            newParseContext.state = ParseState.UnexpectedArgumentFound;
        }
    } else {
        newParseContext.name = potentialArg.slice(1);
        if (newParseContext.name.includes('=')) {
            [newParseContext.name, newParseContext.value] = newParseContext.name.split('=');
            newParseContext.state = ParseState.GlobalCommandArgumentNameAndValueFound;
        }
        // check argument name
        if (newParseContext.name !== commandShortAlias) {
            newParseContext.state = ParseState.UnexpectedArgumentFound;
        } else {
            // replace commandShortAlias with commandName
            newParseContext.name = commandName;
        }
    }
    return newParseContext;
}

/**
 * Generator function for parse events
 */
function* parseEventGenerator(potentialArgs: string[], commandName: string, commandShortAlias: string | undefined,
    type: ArgumentValueTypeName): Iterable<ParseEvent> {

    let parseContext: ParseContext = new ParseContext();

    for (const potentialArg of potentialArgs) {

        // check if unexpected arg has triggered flushing mode
        if ((parseContext.state === ParseState.UnexpectedArgumentFound)
            || (parseContext.state === ParseState.GlobalCommandArgumentNameAndValueFound)) {
            yield { type: ParseEventType.Unused, unusedArg: potentialArg };
            continue;
        }

        // attempt to parse as option
        const newParseContext = parsePotentialGlobalCommandArgument(potentialArg, commandName, commandShortAlias);
        if (newParseContext.state === ParseState.GlobalCommandArgumentNameFound) {

            yield* flushParseContext(parseContext, type);
            parseContext = newParseContext;
            continue;
        } else if (newParseContext.state === ParseState.GlobalCommandArgumentNameAndValueFound) {

            yield* flushParseContext(parseContext, type);
            yield* flushParseContext(newParseContext, type);
            resetParseContext(parseContext);
            continue;
        } else if (newParseContext.state === ParseState.UnexpectedArgumentFound) {
            yield* flushParseContext(parseContext, type);
            yield {
                type: ParseEventType.Unused,
                unusedArg: potentialArg
            };
            resetParseContext(parseContext);
            continue;
        }

        // at this point, the current potentialArg is either the global command value or an unused arg

        // allocate as existing option value if possible
        if (parseContext.state === ParseState.GlobalCommandArgumentNameFound) {

            // if value is non-boolean prefer to assume boolean value was implicit and treat
            // potentialArg as a following positional arg
            if ((potentialArg !== 'true') && (potentialArg !== 'false') && type === ArgumentValueTypeName.Boolean) {
                parseContext.value = 'true';
                parseContext.state = ParseState.GlobalCommandArgumentNameAndValueFound;
                yield* flushParseContext(parseContext, type);
                resetParseContext(parseContext);
            } else {
                parseContext.value = potentialArg;
                parseContext.state = ParseState.GlobalCommandArgumentNameAndValueFound;
                yield* flushParseContext(parseContext, type);
                resetParseContext(parseContext);
                continue;
            }
        }

        // unused arg
        yield {
            type: ParseEventType.Unused,
            unusedArg: potentialArg
        };
    }
    yield* flushParseContext(parseContext, type);
}

/**
 * Populate [[CommandArgs]] for the provided [[GlobalCommand]] using the provided potential args.
 *
 * @param globalCommand the [[GlobalCommand]] for which [[CommandArgs]] values should be populated
 * @param potentialArgs the potential args to use for population
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided args have parse errors
 *
 * @return any successfully populated [[CommandArgs]] and any args which were unused
 */
export default function populateGlobalCommandValue(globalCommand: GlobalCommand, potentialArgs: string[],
    invalidArgs: InvalidArg[]): PopulateResult {

    log(`Populating args: ${potentialArgs.join(' ')} for global command: ${globalCommand.name}`);

    const commandArgs: CommandArgs = {};
    const unusedArgs: string[] = [];

    // short circuit if provided global command doesn't provide an argument
    if (_.isUndefined(globalCommand.argument)) {
        return {
            commandArgs,
            unusedArgs: potentialArgs
        };
    }

    const argName = globalCommand.argument.name;

    // loop through parsing events
    for (const parseEvent of parseEventGenerator(potentialArgs, globalCommand.name, globalCommand.shortAlias,
        globalCommand.argument.type || ArgumentValueTypeName.String)) {

        switch (parseEvent.type) {
        case ParseEventType.Unused:
            if (_.isUndefined(parseEvent.unusedArg)) {
                throw new Error('Unexpected state in parsing, unusedArg is not populated!');
            }
            unusedArgs.push(parseEvent.unusedArg);
            break;
        case ParseEventType.Error:
            if (_.isUndefined(parseEvent.error)) {
                throw new Error('Unexpected state in parsing, error is not populated!');
            }
            invalidArgs.push({
                name: parseEvent.name,
                value: parseEvent.value,
                reason: parseEvent.error
            });
            break;
        case ParseEventType.GlobalCommandArgumentSuccess:
            if (_.isUndefined(parseEvent.name) || _.isUndefined(parseEvent.value)) {
                throw new Error('Unexpected state in parsing, name or value is not populated!');
            }
            if (parseEvent.name !== globalCommand.name) {
                throw new Error('Unexpected state in parsing, parsed name is not equal to command name!');
            }
            if (_.isUndefined(commandArgs[argName])) {
                commandArgs[argName] = parseEvent.value as ArgumentValueType;
            } else if (Array.isArray(commandArgs[argName])) {
                if (Array.isArray(parseEvent.value)) {
                    commandArgs[argName] = [...commandArgs[argName] as ArgumentSingleValueType[],
                        ...parseEvent.value];
                } else {
                    commandArgs[argName] = [...commandArgs[argName] as ArgumentSingleValueType[],
                        parseEvent.value];
                }
            } else if (Array.isArray(parseEvent.value)) {
                commandArgs[argName] = [commandArgs[argName] as ArgumentSingleValueType,
                    ...parseEvent.value];
            } else {
                commandArgs[argName] = [commandArgs[argName] as ArgumentSingleValueType,
                    parseEvent.value];
            }
            break;
        default:
            throw new Error(`Unexpected ParseEventType: ${parseEvent.type}`);
        }
    }
    return {
        commandArgs,
        unusedArgs
    };
}
