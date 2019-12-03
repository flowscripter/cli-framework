/**
 * @module @flowscripter/cli-framework
 */

import Command from '../api/Command';
import Option from '../api/Option';
import Argument, { ArgumentValueTypeName } from '../api/Argument';

function validateType(type: ArgumentValueTypeName, value: ArgumentSingleValueType, name: string): void {
    switch (type) {
    case ArgumentValueTypeName.Boolean:
        if (typeof value !== 'boolean') {
            throw new Error(`Specified value: ${value} for argument: ${name} should be a boolean`);
        }
        break;
    case ArgumentValueTypeName.Number:
        if (typeof value !== 'number') {
            throw new Error(`Specified value: ${value} for argument: ${name} should be a number`);
        }
        break;
    case ArgumentValueTypeName.String:
        if (typeof value !== 'string') {
            throw new Error(`Specified value: ${value} for argument: ${name} should be a string`);
        }
        break;
    default:
        throw new Error(`Unsupported argument type: ${type} for argument: ${name}`);
    }
}

function validateArgument(argument: Argument): void {

    // check if the type of values in argument validValues does not match the type specified in argument type
    if (argument.validValues) {
        argument.validValues.forEach((value) => {
            const type = argument.type || ArgumentValueTypeName.String;
            validateType(type, value, argument.name);
        });
    }
}

function validateOption(option: Option): void {
    validateArgument(option);

    // check if the option defaultValue is an array and option does not support array
    if (Array.isArray(option.defaultValue) && !option.isArray) {
        throw new Error(`Default value for option: ${
            option.name} is an array but the option does not support array values`);
    }

    // check if the type of option defaultValue does not match the type specified in argument type
    if (option.defaultValue) {
        const type = option.type || ArgumentValueTypeName.String;
        if (Array.isArray(option.defaultValue)) {
            option.defaultValue.forEach((value) => {
                validateType(type, value, option.name);

                // check if the option default value does not match any values specified in argument valid values
                if (option.validValues) {
                    if (!option.validValues.includes(value)) {
                        throw new Error(`Default value: ${
                            value} is not one of the specified valid values for option: ${option.name}`);
                    }
                }
            });

        } else {
            validateType(type, option.defaultValue, option.name);

            // check if the option default value does not match any values specified in argument valid values
            if (option.validValues) {
                if (!option.validValues.includes(option.defaultValue)) {
                    throw new Error(`Default value: ${
                        option.defaultValue} is not one of the specified valid values for option: ${option.name}`);
                }
            }
        }
    }
}

/**
 * Validates the provided [[Command]].
 *
 * @param command the [[Command]] to validate
 *
 * @throws *Error* if:
 * * the type of [[Option.defaultValue]] does not match the type specified in [[Argument.type]]
 * * the type of values in [[Argument.validValues]] does not match the type specified in [[Argument.type]]
 * * the value of [[Option.defaultValue]] does not match any values specified in [[Argument.validValues]]
 * * a global/qualifier [[Command]] defines [[Option]] arguments (it should only define [[Positional]] arguments)
 * * there are duplicate [[Argument.name]] or [[Option.shortAlias]] values
 */
export default function validateCommand(command: Command): void {

    const argumentNames: string[] = [];
    const optionAliases: string[] = [];

    if (command.options) {

        // check if a global/qualifier command defines option arguments (it should only define positional arguments)
        if (command.isGlobal && command.options.length > 0) {
            throw new Error(`Command: ${command.name
            } is global/qualifier and it defines Options (it should only define Positionals)`);
        }
        command.options.forEach((option) => {

            // check if there are duplicate argument names
            if (argumentNames.includes(option.name)) {
                throw new Error(`Command: ${command.name} defines duplicate argument name: ${option.name}`);
            }
            argumentNames.push(option.name);
            if (option.shortAlias) {
                // check if there are duplicate argument names or option short aliases
                if (argumentNames.includes(option.shortAlias)) {
                    throw new Error(`Command: ${command.name} defines duplicate argument name or option short alias: ${
                        option.shortAlias}`);
                }
                if (optionAliases.includes(option.shortAlias)) {
                    throw new Error(`Command: ${command.name} defines duplicate short alias: ${option.shortAlias}`);
                }
                optionAliases.push(option.shortAlias);
            }
            validateOption(option);
        });
    }

    if (command.positionals) {
        command.positionals.forEach((positional) => {

            // check if there are duplicate argument names
            if (argumentNames.includes(positional.name)) {
                throw new Error(`Command: ${command.name} defines duplicate argument name: ${positional.name}`);
            }
            argumentNames.push(positional.name);
            validateArgument(positional);
        });
    }
}
