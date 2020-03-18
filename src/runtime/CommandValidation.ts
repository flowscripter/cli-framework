/**
 * @module @flowscripter/cli-framework
 */

import Option from '../api/Option';
import SubCommand from '../api/SubCommand';
import GroupCommand from '../api/GroupCommand';
import GlobalCommand from '../api/GlobalCommand';
import { ArgumentSingleValueType, ArgumentValueTypeName } from '../api/ArgumentValueType';
import Argument from '../api/Argument';
import Command from '../api/Command';
import {
    isGlobalCommand,
    isGlobalModifierCommand,
    isGroupCommand,
    isSubCommand
} from '../api/CommandTypeGuards';

function validateType(type: ArgumentValueTypeName, value: ArgumentSingleValueType, name: string): void {
    switch (type) {
    case ArgumentValueTypeName.Boolean:
        if (typeof value !== 'boolean') {
            throw new Error(`Specified value: ${value} for ${name} should be a boolean`);
        }
        break;
    case ArgumentValueTypeName.Number:
        if (typeof value !== 'number') {
            throw new Error(`Specified value: ${value} for ${name} should be a number`);
        }
        break;
    case ArgumentValueTypeName.String:
        if (typeof value !== 'string') {
            throw new Error(`Specified value: ${value} for ${name} should be a string`);
        }
        break;
    default:
        throw new Error(`Unsupported argument type: ${type} for ${name}`);
    }
}

function isAlphaNumeric(value: string): boolean {
    return value.match(/[a-z0-9]$/i) !== null;
}

function isAlphaNumericOrDash(value: string): boolean {
    return value.match(/[a-z0-9\-_]+$/i) !== null;
}

function isValidName(name: string): boolean {
    return isAlphaNumericOrDash(name) && !name.startsWith('-');
}

function validateArgument(argument: Argument): void {

    if (!isValidName(argument.name)) {
        throw new Error(`Argument name: ${argument.name} is not allowable`);
    }

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

    if (option.shortAlias && (option.shortAlias.length !== 1 || !isAlphaNumeric(option.shortAlias))) {
        throw new Error(`Short alias: ${option.shortAlias} for option: ${option.name} is not allowable`);
    }

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
                if (option.validValues && option.validValues.length > 0) {
                    if (!option.validValues.includes(value)) {
                        throw new Error(`Default value: ${
                            value} is not one of the specified valid values for option: ${option.name}`);
                    }
                }
            });

        } else {
            validateType(type, option.defaultValue, option.name);

            // check if the option default value does not match any values specified in argument valid values
            if (option.validValues && option.validValues.length > 0) {
                if (!option.validValues.includes(option.defaultValue)) {
                    throw new Error(`Default value: ${
                        option.defaultValue} is not one of the specified valid values for option: ${option.name}`);
                }
            }
        }
    }
}

/**
 * Validates the provided [[SubCommand]].
 *
 * @param subCommand the [[SubCommand]] to validate
 *
 * @throws *Error* if:
 * * the [[Command.name]] does not consist only of alphanumeric non-whitespace ASCII characters or `_` and `-`
 * characters or starts with `-`.
 * * any [[SubCommandArgument.name]] name does not consist only of alphanumeric non-whitespace ASCII characters
 * or `_` and `-` characters or starts with `-`.
 * * any [[Option.shortAlias]] does not consist of a single alphanumeric non-whitespace ASCII character.
 * * the type of [[Option.defaultValue]] does not match the type specified in [[Argument.type]]
 * * the type of values in [[Argument.validValues]] does not match the type specified in [[Argument.type]]
 * * the value of [[Option.defaultValue]] does not match any values specified in [[Argument.validValues]]
 * * there are duplicate [[SubCommandArgument.name]] or [[Option.shortAlias]] values
 */
export function validateSubCommand(subCommand: SubCommand): void {

    if (!isValidName(subCommand.name)) {
        throw new Error(`Sub-command name: ${subCommand.name} is not allowable`);
    }

    const argumentNames: string[] = [];
    const optionAliases: string[] = [];

    if (subCommand.options) {

        subCommand.options.forEach((option) => {

            // check if there are duplicate argument names
            if (argumentNames.includes(option.name)) {
                throw new Error(`Sub-Command: ${subCommand.name} defines duplicate argument name: ${option.name}`);
            }
            argumentNames.push(option.name);
            if (option.shortAlias) {
                // check if there are duplicate argument names or option short aliases
                if (argumentNames.includes(option.shortAlias)) {
                    throw new Error(`Sub-Command: ${subCommand.name}`
                        + ` defines duplicate argument name or option short alias: ${option.shortAlias}`);
                }
                if (optionAliases.includes(option.shortAlias)) {
                    throw new Error(`Sub-Command: ${subCommand.name}`
                        + ` defines duplicate short alias: ${option.shortAlias}`);
                }
                optionAliases.push(option.shortAlias);
            }
            validateOption(option);
        });
    }

    if (subCommand.positionals) {

        for (let i = 0; i < subCommand.positionals.length; i += 1) {
            const positional = subCommand.positionals[i];

            // check if there are duplicate argument names
            if (argumentNames.includes(positional.name)) {
                throw new Error(`Sub-Command: ${subCommand.name} defines duplicate argument name: ${positional.name}`);
            }
            argumentNames.push(positional.name);

            // check only last item is positional
            if ((i < subCommand.positionals.length - 1)
                && (positional.isVarArgOptional || positional.isVarArgMultiple)) {
                throw new Error(`Sub-Command: ${subCommand.name}`
                    + 'defines varargs positional which is not the last positional argument');
            }
            validateArgument(positional);
        }
    }
}

/**
 * Validates the provided [[GroupCommand]].
 *
 * @param groupCommand the [[GroupCommand]] to validate
 *
 * @throws *Error* if:
 * * the [[Command.name]] does not consist only of alphanumeric non-whitespace ASCII characters or `_` and `-`
 * characters or starts with `-`.
 * * there are no member [[SubCommand]] instances
 * * any of the member [[SubCommand]] instances are not valid (via calling [[validateSubCommand]])
 * * if any of the member [[SubCommand]] instances define duplicate names
 * * if any of the member [[SubCommand]] instances define a name which duplicates the group command name
 */
export function validateGroupCommand(groupCommand: GroupCommand): void {

    if (!isValidName(groupCommand.name)) {
        throw new Error(`Group command name: ${groupCommand.name} is not allowable`);
    }

    const subCommandNames: string[] = [];

    if (groupCommand.memberSubCommands.length === 0) {
        throw new Error(`Group Command: ${groupCommand.name} has no member sub-commands`);
    }

    groupCommand.memberSubCommands.forEach((subCommand) => {

        // check if there are duplicate command names
        if (subCommandNames.includes(subCommand.name)) {
            throw new Error(`Group Command: ${groupCommand.name}`
                + `contains member sub-commands with duplicate names: ${subCommand.name}`);
        }
        // check if there is a duplicate meember and group command name
        if (subCommand.name === groupCommand.name) {
            throw new Error(`Group Command: ${groupCommand.name}`
                + `contains member sub-command with the same name: ${subCommand.name}`);
        }
        subCommandNames.push(subCommand.name);
        validateSubCommand(subCommand);
    });
}

/**
 * Validates the provided [[GlobalCommand]].
 *
 * @param globalCommand the [[GlobalCommand]] to validate
 *
 * @throws *Error* if:
 * * the [[Command.name]] does not consist only of alphanumeric non-whitespace ASCII characters or `_` and `-`
 * characters or starts with `-`.
 * * the [[GlobalCommand.shortAlias]] does not consist of a single alphanumeric non-whitespace ASCII characters.
 * * the [[GlobalCommand.argument]] is defined and it is not valid.
 */
export function validateGlobalCommand(globalCommand: GlobalCommand): void {

    if (!isValidName(globalCommand.name)) {
        throw new Error(`Global command name: ${globalCommand.name} is not allowable`);
    }
    if (globalCommand.shortAlias
        && (globalCommand.shortAlias.length !== 1 || !isAlphaNumeric(globalCommand.shortAlias))) {
        throw new Error(`Short alias: ${globalCommand.shortAlias} for global command:`
            + ` ${globalCommand.name} is not allowable`);
    }

    if (globalCommand.argument) {

        const { argument } = globalCommand;

        validateArgument(argument);

        const type = argument.type || ArgumentValueTypeName.String;

        if (argument.defaultValue) {
            // check if the default value has the correct type
            validateType(type, argument.defaultValue, globalCommand.name);

            // check if the default value is a valid value sif they are specified
            if (argument.validValues && argument.validValues.length > 0) {
                if (!argument.validValues.includes(argument.defaultValue)) {
                    throw new Error(`Default value: ${argument.defaultValue} is`
                        + ` not one of the specified valid values for global command: ${globalCommand.name}`);
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
 * @throws *Error* if the provided command does not pass validation or if the provided [[Command]] sub-class is not
 * supported.
 */
export default function validateCommand(command: Command): void {

    if (isSubCommand(command)) {
        validateSubCommand(command);
        return;
    }

    if (isGlobalCommand(command) || isGlobalModifierCommand(command)) {
        validateGlobalCommand(command);
        return;
    }

    if (isGroupCommand(command)) {
        validateGroupCommand(command);
        return;
    }
    throw new Error('Unsupported command type provided');
}
