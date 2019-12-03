/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';

/**
 * Interface for positional arguments for a [[Command]].
 *
 * This will be used for invocation in the form of `executable <command_name> <positional_value>`
 */
export default interface Positional extends Argument {

    /**
     * If this is `true` the option can be specified multiple times and all values will be returned in an array
     * matching the order provided.
     *
     * Note that if [[Argument.isOptional]] is `false`, at least one entry for the vararg must be specified.
     *
     * **NOTE**: There must be only one positional with this set and it must appear as the last entry in
     * [[Command.positionals]]. As an example `executable command --other=1 foo bar`
     */
    readonly isVarArg?: boolean;

    /**
     * Should the "varargs" positional be optional.
     *
     * **NOTE**: This value is ignored if [[isVarArg]] is `false`.
     */
    readonly isVarArgOptional?: boolean;
}
