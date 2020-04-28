/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import Argument from '../../api/Argument';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import { InvalidArg, InvalidReason } from '../../api/Parser';
import { ArgumentSingleValueType, ArgumentValueType, ArgumentValueTypeName } from '../../api/ArgumentValueType';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';

function validateValue(argument: Argument, name: string, value: ArgumentSingleValueType):
    { validValue?: ArgumentSingleValueType; error?: InvalidArg } {

    let convertedValue;

    // type check and conversion
    switch (argument.type) {
    case ArgumentValueTypeName.Boolean:
        if (value !== 'true' && value !== 'false') {
            return {
                error: {
                    name,
                    value,
                    reason: InvalidReason.IncorrectType
                }
            };
        }
        convertedValue = (value === 'true');
        break;
    case ArgumentValueTypeName.Number:
        if (Number.isNaN(Number(value))) {
            return {
                error: {
                    name,
                    value,
                    reason: InvalidReason.IncorrectType
                }
            };
        }
        convertedValue = Number(value);
        break;
    case ArgumentValueTypeName.String:
    default:
        convertedValue = String(value);
        break;
    }

    // check if the value is valid
    if (argument.validValues && argument.validValues.length > 0 && !argument.validValues.includes(value)) {
        return {
            error: {
                name,
                value,
                reason: InvalidReason.IllegalValue
            }
        };
    }
    return { validValue: convertedValue };
}

function validateArrayValue(argument: Argument, name: string, value: ArgumentSingleValueType[]):
    { validValue?: ArgumentSingleValueType[]; error?: InvalidArg } {

    const convertedArray: ArgumentSingleValueType[] = [];

    for (let i = 0; i < value.length; i += 1) {
        const singleValue: ArgumentSingleValueType = value[i];
        const { validValue, error } = validateValue(argument, name, singleValue);
        if (!_.isUndefined(validValue)) {
            convertedArray.push(validValue);
        }
        if (error) {
            // fast fail
            return {
                validValue: convertedArray,
                error
            };
        }
    }
    return {
        validValue: convertedArray
    };
}

function validateArgumentValue(argument: Argument, name: string, value: ArgumentValueType | undefined, isArray: boolean,
    isOptional: boolean, defaultValue: ArgumentValueType | undefined, invalidArgs: InvalidArg[]):
    ArgumentValueType | undefined {

    // if there is a value, check if it is valid
    if (!_.isUndefined(value)) {
        let validationResult;

        if (Array.isArray(value)) {
            if (!isArray) {
                invalidArgs.push({
                    name,
                    value,
                    reason: InvalidReason.IllegalMultipleValues
                });
                return undefined;
            }
            validationResult = validateArrayValue(argument, name, value);
        } else {
            validationResult = validateValue(argument, name, value);
        }
        if (validationResult.error) {
            invalidArgs.push(validationResult.error);
            return undefined;
        }
        return validationResult.validValue;
    }
    // if there is no value, check if there is a default
    if (!_.isUndefined(defaultValue)) {
        return defaultValue;
    }
    // if there is no value, check if it was optional
    if (!isOptional) {

        invalidArgs.push({
            name,
            reason: InvalidReason.MissingValue
        });
    }
    return undefined;

}

/**
 * Validates the provided value against the provided [[Option]].
 *
 * @param option the [[Option]] to validate against
 * @param value the value (if any) for the [[Option]]
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided value is invalid
 *
 * @return a valid value or undefined if the provided value was either undefined or invalid
 */
export function validateOptionValue(option: Option, value: ArgumentValueType | undefined, invalidArgs: InvalidArg[]):
    ArgumentValueType | undefined {

    return validateArgumentValue(option, option.name, value, option.isArray || false,
        option.isOptional || false, option.defaultValue, invalidArgs);
}

/**
 * Validates the provided value against the provided [[Positional]].
 *
 * @param positional the [[Positional]] to validate against
 * @param value the value (if any) for the [[Positional]]
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided value is invalid
 *
 * @return a valid value or undefined if the provided value was either undefined or invalid
 */
export function validatePositionalValue(positional: Positional, value: ArgumentValueType | undefined,
    invalidArgs: InvalidArg[]): ArgumentValueType | undefined {

    return validateArgumentValue(positional, positional.name, value, positional.isVarArgMultiple || false,
        positional.isVarArgOptional || false, undefined, invalidArgs);
}

/**
 * Validates the provided value against the provided [[GlobalCommandArgument]].
 *
 * @param glocalCommandArgument the [[GlobalCommandArgument]] to validate against
 * @param value the value (if any) for the [[GlobalCommandArgument]]
 * @param invalidArgs an array of [[InvalidArg]] which may be added to if the provided value is invalid
 *
 * @return a valid value or undefined if the provided value was either undefined or invalid
 */
export function validateGlobalCommandArgumentValue(glocalCommandArgument: GlobalCommandArgument,
    value: ArgumentValueType | undefined, invalidArgs: InvalidArg[]): ArgumentValueType | undefined {

    return validateArgumentValue(glocalCommandArgument, glocalCommandArgument.name, value, false,
        glocalCommandArgument.isOptional || false, glocalCommandArgument.defaultValue, invalidArgs);
}
