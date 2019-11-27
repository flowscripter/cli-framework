/**
 * @module @flowscripter/cli-framework
 */

import Argument, { ArgumentValueTypeName } from '../../api/Argument';
import Option from '../../api/Option';
import Positional from '../../api/Positional';
import { InvalidArg, InvalidReason } from './Parser';

function validateValue(argument: Argument, value: ArgumentSingleValueType):
    { validValue?: ArgumentSingleValueType; error?: InvalidArg } {

    let convertedValue = value;

    // type check and conversion
    switch (argument.type) {
    case ArgumentValueTypeName.Boolean:
        if (value !== 'true' && value !== 'false') {
            return {
                error: {
                    name: argument.name,
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
                    name: argument.name,
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
                name: argument.name,
                value,
                reason: InvalidReason.IllegalValue
            }
        };
    }
    return { validValue: convertedValue };
}

function validateArrayValue(argument: Argument, value: ArgumentSingleValueType[]):
    { validValue?: ArgumentSingleValueType[]; error?: InvalidArg } {

    const convertedArray: ArgumentSingleValueType[] = [];

    for (let i = 0; i < value.length; i += 1) {
        const singleValue: ArgumentSingleValueType = value[i];
        const { validValue, error } = validateValue(argument, singleValue);
        if (validValue !== undefined) {
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

function validateArgumentValue(argument: Argument, value: ArgumentValueType | undefined, isArray: boolean,
    isOptional: boolean, defaultValue: ArgumentValueType | undefined, invalidArgs: InvalidArg[]):
    ArgumentValueType | undefined {

    // if there is a value, check if it is valid
    if (value !== undefined) {
        let validationResult;

        if (Array.isArray(value)) {
            if (!isArray) {
                invalidArgs.push({
                    name: argument.name,
                    value,
                    reason: InvalidReason.IllegalMultipleValues
                });
                return undefined;
            }
            validationResult = validateArrayValue(argument, value);
        } else {
            validationResult = validateValue(argument, value);
        }
        if (validationResult.error) {
            invalidArgs.push(validationResult.error);
            return undefined;
        }
        return validationResult.validValue;
    }
    // if there is no value, check if there is a default
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    // if there is no value, check if it was optional
    if (!isOptional) {

        invalidArgs.push({
            name: argument.name,
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

    return validateArgumentValue(option, value, option.isArray || false,
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

    return validateArgumentValue(positional, value, positional.isVarArg || false,
        positional.isVarArgOptional || false, undefined, invalidArgs);
}
