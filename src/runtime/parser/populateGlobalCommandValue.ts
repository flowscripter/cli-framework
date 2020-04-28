/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import debug from 'debug';
import { InvalidArg, InvalidReason } from '../../api/Parser';
import { ArgumentValueTypeName } from '../../api/ArgumentValueType';
import GlobalCommand from '../../api/GlobalCommand';
import { PopulateResult } from './PopulateResult';

const log: debug.Debugger = debug('GlobalCommandValuePopulation');

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

    const { argument } = globalCommand;

    // short circuit if provided global command doesn't define an argument
    if (_.isUndefined(argument)) {
        return {
            commandArgs: {},
            unusedArgs: potentialArgs
        };
    }

    // check if there are no potential arguments
    if (potentialArgs.length === 0) {

        // check if argument type is boolean and therefore command being specified is an implicit value of true
        if (argument.type === ArgumentValueTypeName.Boolean) {
            return {
                commandArgs: {
                    [argument.name]: 'true'
                },
                unusedArgs: []
            };
        }

        // error if the global command argument is not optional and there is no default value
        if (!argument.isOptional && _.isUndefined(argument.defaultValue)) {
            invalidArgs.push({
                name: argument.name,
                reason: InvalidReason.MissingValue
            });
        }
        return {
            commandArgs: {},
            unusedArgs: []
        };
    }

    // the first potentialArg is the only one we are interested in
    return {
        commandArgs: {
            [argument.name]: potentialArgs[0]
        },
        unusedArgs: potentialArgs.slice(1)
    };
}
