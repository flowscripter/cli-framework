/**
 * @module @flowscripter/cli-framework
 */

import SubCommandArgument from './SubCommandArgument';
import { ArgumentValueType } from './ArgumentValueType';

/**
 * Interface for optional [[SubCommand]] arguments.
 *
 * This will be used for invocation in the form of `executable <sub_command_name> --<option_name>=<option_value>`
 *
 * **NOTE**: For an [[Option]] of type `boolean`:
 *
 * * specifying `--<name>` is equivalent to `--<name>=true`
 * * not specifying the argument is equivalent to `--<name>=false`
 */
export default interface Option extends SubCommandArgument {

    /**
     * Optional short alias for the option.
     *
     * This will be used for invocation in the form of `executable <sub_command_name> -<shortAlias>=<option_value>`
     *
     * Must consist of a single alphanumeric non-whitespace ASCII character.
     */
    readonly shortAlias?: string;

    /**
     * Default value for the argument if not specified.
     */
    readonly defaultValue?: ArgumentValueType;

    /**
     * If this is `true` the option does not need to be specified nor have a default value.
     */
    readonly isOptional?: boolean;

    /**
     * If this is `true` the option can be specified multiple times and all values will be returned in an array
     * matching the order provided.
     *
     * As an example `executable <sub_command_name> --<option_name>=<option_value_1> --<option_name>=<option_value_2>`
     *
     * Note that if [[isOptional]] is `false`, at least one instance of the option must be specified.
     */
    readonly isArray?: boolean;
}
