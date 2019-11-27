/**
 * @module @flowscripter/cli-framework
 */

import Context from './Context';
import Option from './Option';
import Positional from './Positional';

/**
 * Type of arguments supplied to a command
 */
export interface CommandArgs {
    [argName: string]: ArgumentValueType;
}

/**
 * Interface to be implemented by a [[Command]] implementation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Command<S_ID> {

    /**
     * Name of the command.
     *
     * Must consist of alphanumeric non-whitespace ASCII characters or `_` and `-` characters.
     * Cannot start with `-` or `--`.
     */
    readonly name: string;

    /**
     * Optional aliases for the command.
     *
     * Must consist of alphanumeric non-whitespace ASCII characters or `_` and `-` characters.
     * Cannot start with `-`.
     */
    readonly aliases?: ReadonlyArray<string>;

    /**
     * The command should be treated as a global option.
     *
     * In this is `true`:
     *
     * * invocation will take the form of `executable --<command_name> [command_arguments]`
     * * help output will appear in the global options section
     *
     * If not specified, the default is `false`.
     */
    readonly isGlobal?: boolean;

    /**
     * Should the command be treated as a qualifier if [[isGlobal]] is `true`.
     *
     * When treated as a qualifier:
     *
     * * more than one global qualifier command can be used e.g.
     *
     * `executable --<global_qualifier_command> [command_arguments] --<global_qualifier_command> [command_arguments]`
     * * another global or non-global command must be specified e.g.
     *
     * `executable --<global_qualifier_command> [command_arguments] <command> [command_arguments]`
     *
     * A concrete example for this is:
     *
     * `myApp --config config.json --loglevel verbose update --all`
     *
     * where:
     *
     * * `config` and `loglevel` are global qualifier commands
     * * `update` is a standard command
     *
     * If not specified, the default is `false`.
     *
     * **NOTE**: This value is ignored if [[isGlobal]] is `false`.
     */
    readonly isGlobalQualifier?: boolean;

    /**
     * The command should be treated as a default command.
     *
     * In this is `true` and no other command is matched after parsing the CLI arguments,
     * this command will be run. If not specified, the default is `false`.
     */
    readonly isDefault?: boolean;

    /**
     * Optional description of the command.
     */
    readonly description?: string;

    /**
     * Optional usage example for the command.
     */
    readonly usage?: string;

    /**
     * Optional group name for the command (used to group commands in help).
     */
    readonly group?: string;

    /**
     * Optional option arguments for the command.
     */
    readonly options?: ReadonlyArray<Option>;

    /**
     * Optional positional arguments for the command.
     */
    readonly positionals?: ReadonlyArray<Positional>;

    /**
     * Run the command.
     *
     * @param commandArgs the arguments for the command.
     * @param context the [[Context]] in which to run.
     */
    run(commandArgs: CommandArgs, context: Context<S_ID>): Promise<void>;
}
