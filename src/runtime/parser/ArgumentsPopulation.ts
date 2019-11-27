/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable no-continue */

import debug from 'debug';
import Command, { CommandArgs } from '../../api/Command';
import { InvalidArg, InvalidReason } from './Parser';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import { ArgumentValueTypeName } from '../../api/Argument';

const log: debug.Debugger = debug('ArgumentPopulation');

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
     * The name of an argument i.e. [[type]] is OptionSuccess, PositionalSuccess, IllegalMultipleValues
     */
    readonly name?: string;

    /**
     * The value of an argument i.e. [[type]] is OptionSuccess, PositionalSuccess, or IllegalMultipleValues
     */
    readonly value?: string | string[];

    /**
     * Parse error i.e. [[type]] is IllegalMultipleValues
     */
    readonly error?: InvalidReason;

    /**
     * An arg which was not used i.e. [[type]] is Unused
     */
    readonly unusedArg?: string;
}

/**
 * A container holding the result of arguments population.
 */
export interface PopulateResult {

    /**
     * Populated arguments
     */
    commandArgs: CommandArgs;

    /**
     * Any arguments which were unused during arguments population.
     */
    unusedArgs: string[];
}

function* flushParseContext(parseContext: ParseContext): Iterable<ParseEvent> {
    switch (parseContext.state) {
    case ParseState.Empty:
        return;
    case ParseState.OptionNameFound:
        if (parseContext.option && (parseContext.option.type === ArgumentValueTypeName.Boolean)
            && (parseContext.value === undefined)) {
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
    // eslint-disable-next-line no-param-reassign
    parseContext.state = ParseState.Empty;
    // eslint-disable-next-line no-param-reassign
    delete parseContext.option;
    // eslint-disable-next-line no-param-reassign
    delete parseContext.positional;
    // eslint-disable-next-line no-param-reassign
    delete parseContext.name;
    // eslint-disable-next-line no-param-reassign
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
            [newParseContext.name, newParseContext.value] = newParseContext.name.split('=');
            newParseContext.state = ParseState.OptionNameAndValueFound;
        }
        // map to option
        newParseContext.option = optionsByName.get(newParseContext.name);
    } else {
        newParseContext.name = potentialArg.slice(1);
        if (newParseContext.name.includes('=')) {
            [newParseContext.name, newParseContext.value] = newParseContext.name.split('=');
            newParseContext.state = ParseState.OptionNameAndValueFound;
        }
        // map to option
        newParseContext.option = optionsByAlias.get(newParseContext.name);
        if (newParseContext.option) {
            newParseContext.name = newParseContext.option.name;
        }
    }
    if (!newParseContext.option) {
        newParseContext.state = ParseState.UnexpectedOptionFound;
    }
    return newParseContext;
}

function parsePotentialPositional<S_ID>(potentialArg: string, command: Command<S_ID>, parseContext: ParseContext):
    ParseContext {

    const { positionalCount } = parseContext;

    // check if no valid positional
    if (!command.positionals || positionalCount > (command.positionals.length - 1)) {
        return new ParseContext();
    }
    const newParsecontext = new ParseContext(ParseState.PositionalFound);
    newParsecontext.positional = command.positionals[positionalCount];
    newParsecontext.name = newParsecontext.positional.name;
    newParsecontext.value = potentialArg;
    newParsecontext.positionalCount = positionalCount;
    if (!newParsecontext.positional.isVarArg) {
        newParsecontext.positionalCount += 1;
    }
    return newParsecontext;
}

/**
 * Generator function for parse events
 */
function* parseEventGenerator<S_ID>(command: Command<S_ID>, potentialArgs: string[],
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
        newParseContext = parsePotentialPositional(potentialArg, command, parseContext);
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
 * Populate [[CommandArgs]] for the provided [[Command]] using the provided potential args
 *
 * @param command the [[Command]] for which [[CommandArgs]] values should be populated
 * @param potentialArgs the potential args to use for population
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided args have parse errors
 *
 * @return any successfully populated [[CommandArgs]] and any args which were unused
 */
export default function populateArguments<S_ID>(command: Command<S_ID>, potentialArgs: string[],
    invalidArgs: InvalidArg[]): PopulateResult {

    log(`Populating args: ${potentialArgs.join(' ')} for command: ${command.name}`);

    // need to be able to map from option names and aliases
    const optionsByName: Map<string, Option> = new Map();
    const optionsByAlias: Map<string, Option> = new Map();

    if (command.options) {
        command.options.forEach((option) => {
            optionsByName.set(option.name, option);
            if (option.shortAlias) {
                optionsByAlias.set(option.shortAlias, option);
            }
        });
    }

    const commandArgs: CommandArgs = {};
    const unusedArgs: string[] = [];

    // loop through parsing events
    for (const parseEvent of parseEventGenerator(command, potentialArgs, optionsByName, optionsByAlias)) {

        switch (parseEvent.type) {
        case ParseEventType.Unused:
            if (parseEvent.unusedArg === undefined) {
                throw new Error('Unexpected state in parsing, unusedArg is not populated!');
            }
            unusedArgs.push(parseEvent.unusedArg);
            break;
        case ParseEventType.Error:
            if (parseEvent.error === undefined) {
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
            if ((parseEvent.name === undefined) || (parseEvent.value === undefined)) {
                throw new Error('Unexpected state in parsing, name or value is not populated!');
            }
            if (commandArgs[parseEvent.name] === undefined) {
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
