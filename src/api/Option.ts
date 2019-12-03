/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';

/**
 * Interface for optional arguments for a [[Command]].
 *
 * This will be used for invocation in the form of `executable <command_name> --<option_name>=<option_value>`
 *
 * **NOTE**: For an [[Option]] of type `boolean`:
 *
 * * specifying `--<name>` is equivalent to `--<name>=true`
 * * not specifying the argument is equivalent to `--<name>=false`
 */
export default interface Option extends Argument {

    /**
     * Optional short alias for the option.
     *
     * This will be used for invocation in the form of `executable command -<shortAlias>`
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
     * As an example `executable command --<name>=foo --<name>=bar`
     *
     * Note that if [[isOptional]] is `false`, at least one entry for the array must be specified.
     */
    readonly isArray?: boolean;
}
