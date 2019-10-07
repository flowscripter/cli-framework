/**
 * @module @flowscripter/cli-framework
 */

import Context from './Context';
import Option from './Option';
import Parameter from './Parameter';

/**
 * Interface to be implemented by a [[Command]] implementation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Command<S_ID> {

    /**
     * Name of the command.
     *
     * Will always be lowercase with only alphanumeric non-whitespace ASCII or `_` and `-` characters.
     */
    readonly name: string;

    /**
     * Aliases for the command.
     *
     * Will always be lowercase with only alphanumeric non-whitespace ASCII or `_` and `-` characters.
     */
    readonly aliases: string[];

    /**
     * The command should be treated as a global option.
     *
     * In this is `true`:
     *
     * * invocation will take the form of `executable --<command.name>`
     * * help output will appear in the global options section
     */
    readonly isGlobal: boolean;

    /**
     * The command should be treated as a default command.
     *
     * In this is `true` and no other command is matched after parsing the CLI arguments,
     * this command will be run.
     */
    readonly isDefault: boolean;

    /**
     * Description of the command.
     */
    readonly description: string | undefined;

    /**
     * Usage example for the command.
     */
    readonly usage: string | undefined;

    /**
     * Group name for the command (used to group commands in help).
     */
    readonly group: string | undefined;

    /**
     * Parameters (positional arguments) for the command.
     */
    readonly parameters: Parameter<ArgumentValueType>[];

    /**
     * Options (non-positional arguments) for the command.
     */
    readonly options: Option<ArgumentValueType>[];

    /**
     * Run the command.
     *
     * @param context the [[Context]] in which to run.
     */
    run(context: Context<S_ID>): Promise<void>;
}
