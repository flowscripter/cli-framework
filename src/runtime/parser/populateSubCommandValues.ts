/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable no-continue,no-param-reassign */

import _ from 'lodash';
import debug from 'debug';
import { CommandArgs } from '../../api/Command';
import { InvalidArg, InvalidReason } from '../../api/Parser';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import { ArgumentValueTypeName, ArgumentSingleValueType, ArgumentValueType } from '../../api/ArgumentValueType';
import SubCommand from '../../api/SubCommand';
import { PopulateResult } from './PopulateResult';

const log: debug.Debugger = debug('SubCommandValuePopulation');

/**
 * Parse states for parsing loop logic
 */
enum ParseState {

    /**
     * Expecting either an [[Option]] name or [[Positional]] value next
     */
    Empty = 'EMPTY',

    /**
     * Found an [[Option]] name, now expecting an [[Option]] value next
     */
    OptionNameFound = 'OPTION_NAME_FOUND',

    /**
     * Found an [[Option]] name and value, now expecting an [[Option]] name or [[Positional]] value next
     */
    OptionNameAndValueFound = 'OPTION_NAME_AND_VALUE_FOUND',

    /**
     * Found a [[Positional]] value, now expecting an [[Option]] name or [[Positional]] value next
     */
    PositionalFound = 'POSITIONAL_FOUND',

    /**
     * Unexpected [[Option]] found, flushing the remaining args
     */
    UnexpectedOptionFound = 'UNEXPECTED_OPTION_FOUND'
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

    /**
     * If the argument [[name]] has been associated to an [[Option]]
     */
    option?: Option;

    /**
     * If the argument [[name]] has been associated to a [[Positional]]
     */
    positional?: Positional;

    /**
     * Current positional count
     */
    positionalCount = 0;
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
     * An [[Option]] was successfully populated
     */
    OptionSuccess = 'OPTION_SUCCESS',

    /**
     * An [[Positional]] was successfully populated
     */
    PositionalSuccess = 'POSITIONAL_SUCCESS'
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
     * The name of an argument i.e. [[type]] is OptionSuccess or PositionalSuccess
     */
    readonly name?: string;

    /**
     * The value of an argument i.e. [[type]] is OptionSuccess or PositionalSuccess
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

function* flushParseContext(parseContext: ParseContext): Iterable<ParseEvent> {
    switch (parseContext.state) {
    case ParseState.Empty:
        return;
    case ParseState.OptionNameFound:
        if (parseContext.option && (parseContext.option.type === ArgumentValueTypeName.Boolean)
            && _.isUndefined(parseContext.value)) {
            // set implicit value of true
            yield {
                type: ParseEventType.OptionSuccess,
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
    case ParseState.OptionNameAndValueFound:

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
            type: ParseEventType.OptionSuccess,
            name: parseContext.name,
            value: parseContext.value
        };
        return;
    case ParseState.PositionalFound:
        yield {
            type: ParseEventType.PositionalSuccess,
            name: parseContext.name,
            value: parseContext.value
        };
        return;
    default:
        throw new Error(`Unexpected ParseState in logic: ${parseContext.state}`);
    }
}

function resetParseContext(parseContext: ParseContext): void {
    parseContext.state = ParseState.Empty;
    delete parseContext.option;
    delete parseContext.positional;
    delete parseContext.name;
    delete parseContext.value;
}

function parsePotentialOption(potentialArg: string, optionsByName: Map<string, Option>,
    optionsByAlias: Map<string, Option>, parseContext: ParseContext): ParseContext {

    const newParseContext = new ParseContext();
    newParseContext.positionalCount = parseContext.positionalCount;

    if (!potentialArg.startsWith('-')) {
        return newParseContext;
    }
    newParseContext.state = ParseState.OptionNameFound;

    if (potentialArg.startsWith('--')) {
        newParseContext.name = potentialArg.slice(2);
        if (newParseContext.name.includes('=')) {
            [newParseContext.name, newParseContext.value] = newParseContext.name.split(/=(.*)/);
            newParseContext.state = ParseState.OptionNameAndValueFound;
        }
        // map to option
        newParseContext.option = optionsByName.get(newParseContext.name);
    } else {
        newParseContext.name = potentialArg.slice(1);
        if (newParseContext.name.includes('=')) {
            [newParseContext.name, newParseContext.value] = newParseContext.name.split(/=(.*)/);
            newParseContext.state = ParseState.OptionNameAndValueFound;
        }
        // map to option
        newParseContext.option = optionsByAlias.get(newParseContext.name);
        // replace option shortAlias with option name
        if (newParseContext.option) {
            newParseContext.name = newParseContext.option.name;
        }
    }
    if (!newParseContext.option) {
        newParseContext.state = ParseState.UnexpectedOptionFound;
    }
    return newParseContext;
}

function parsePotentialPositional(potentialArg: string, subCommand: SubCommand, parseContext: ParseContext):
    ParseContext {

    const { positionalCount } = parseContext;

    // check if no valid positional
    if (positionalCount > (subCommand.positionals.length - 1)) {
        return new ParseContext();
    }
    const newParsecontext = new ParseContext(ParseState.PositionalFound);
    newParsecontext.positional = subCommand.positionals[positionalCount];
    newParsecontext.name = newParsecontext.positional.name;
    newParsecontext.value = potentialArg;
    newParsecontext.positionalCount = positionalCount;
    if (!newParsecontext.positional.isVarArgMultiple) {
        newParsecontext.positionalCount += 1;
    }
    return newParsecontext;
}

/**
 * Generator function for parse events
 */
function* parseEventGenerator(subCommand: SubCommand, potentialArgs: string[],
    optionsByName: Map<string, Option>, optionsByAlias: Map<string, Option>): Iterable<ParseEvent> {

    let parseContext: ParseContext = new ParseContext();

    for (const potentialArg of potentialArgs) {

        // check if unexpected arg has triggered flushing mode
        if (parseContext.state === ParseState.UnexpectedOptionFound) {
            yield { type: ParseEventType.Unused, unusedArg: potentialArg };
            continue;
        }

        // attempt to parse as option
        let newParseContext = parsePotentialOption(potentialArg, optionsByName, optionsByAlias, parseContext);
        if (newParseContext.state === ParseState.OptionNameFound) {

            yield* flushParseContext(parseContext);
            parseContext = newParseContext;
            continue;
        } else if (newParseContext.state === ParseState.OptionNameAndValueFound) {

            yield* flushParseContext(parseContext);
            yield* flushParseContext(newParseContext);
            resetParseContext(parseContext);
            continue;
        } else if (newParseContext.state === ParseState.UnexpectedOptionFound) {
            yield* flushParseContext(parseContext);
            yield {
                type: ParseEventType.Unused,
                unusedArg: potentialArg
            };
            resetParseContext(parseContext);
            continue;
        }

        // at this point, the current potentialArg is either an option value or positional value

        // allocate as existing option value if possible
        if (parseContext.state === ParseState.OptionNameFound) {

            if (!parseContext.option) {
                throw new Error('Unexpected state in parsing, option is not defined!');
            }

            // if value is non-boolean prefer to assume boolean value was implicit and treat
            // potentialArg as a following positional arg
            if ((potentialArg !== 'true') && (potentialArg !== 'false')
                && parseContext.option.type === ArgumentValueTypeName.Boolean) {
                parseContext.value = 'true';
                parseContext.state = ParseState.OptionNameAndValueFound;
                yield* flushParseContext(parseContext);
                resetParseContext(parseContext);
            } else {
                parseContext.value = potentialArg;
                parseContext.state = ParseState.OptionNameAndValueFound;
                yield* flushParseContext(parseContext);
                resetParseContext(parseContext);
                continue;
            }
        }

        // attempt to parse as positional
        newParseContext = parsePotentialPositional(potentialArg, subCommand, parseContext);
        if (newParseContext.state === ParseState.PositionalFound) {

            if (!newParseContext.value) {
                throw new Error('Unexpected state in parsing, new value is not populated!');
            }
            parseContext = newParseContext;
            yield* flushParseContext(parseContext);
            resetParseContext(parseContext);
            continue;
        }

        // unused arg
        yield {
            type: ParseEventType.Unused,
            unusedArg: potentialArg
        };
    }
    yield* flushParseContext(parseContext);
}

/**
 * Populate [[CommandArgs]] for the provided [[SubCommand]] using the provided potential args.
 *
 * @param subCommand the [[SubCommand]] for which [[CommandArgs]] values should be populated
 * @param potentialArgs the potential args to use for population
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided args have parse errors
 *
 * @return any successfully populated [[CommandArgs]] and any args which were unused
 */
export default function populateSubCommandValues(subCommand: SubCommand, potentialArgs: string[],
    invalidArgs: InvalidArg[]): PopulateResult {

    log(`Populating args: ${potentialArgs.length > 0 ? `${potentialArgs.join(' ')} ` : ''}for sub-command: ${
        subCommand.name}`);

    const commandArgs: CommandArgs = {};
    const unusedArgs: string[] = [];

    // short circuit if provided sub-command has no options and no positionals
    if ((subCommand.options.length === 0) && (subCommand.positionals.length === 0)) {
        return {
            commandArgs,
            unusedArgs: potentialArgs
        };
    }

    // need to be able to map from option names and aliases
    const optionsByName: Map<string, Option> = new Map();
    const optionsByAlias: Map<string, Option> = new Map();

    subCommand.options.forEach((option) => {
        optionsByName.set(option.name, option);
        if (option.shortAlias) {
            optionsByAlias.set(option.shortAlias, option);
        }
    });

    // loop through parsing events
    for (const parseEvent of parseEventGenerator(subCommand, potentialArgs, optionsByName, optionsByAlias)) {

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
        case ParseEventType.PositionalSuccess:
        case ParseEventType.OptionSuccess:
            if (_.isUndefined(parseEvent.name) || _.isUndefined(parseEvent.value)) {
                throw new Error('Unexpected state in parsing, name or value is not populated!');
            }
            if (_.isUndefined(commandArgs[parseEvent.name])) {
                commandArgs[parseEvent.name] = parseEvent.value as ArgumentValueType;
            } else if (Array.isArray(commandArgs[parseEvent.name])) {
                if (Array.isArray(parseEvent.value)) {
                    commandArgs[parseEvent.name] = [...commandArgs[parseEvent.name] as ArgumentSingleValueType[],
                        ...parseEvent.value];
                } else {
                    commandArgs[parseEvent.name] = [...commandArgs[parseEvent.name] as ArgumentSingleValueType[],
                        parseEvent.value];
                }
            } else if (Array.isArray(parseEvent.value)) {
                commandArgs[parseEvent.name] = [commandArgs[parseEvent.name] as ArgumentSingleValueType,
                    ...parseEvent.value];
            } else {
                commandArgs[parseEvent.name] = [commandArgs[parseEvent.name] as ArgumentSingleValueType,
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
