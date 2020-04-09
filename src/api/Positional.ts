/**
 * @module @flowscripter/cli-framework-api
 */

import SubCommandArgument from './SubCommandArgument';

/**
 * Interface for positional [[SubCommand]] arguments.
 *
 * This will be used for invocation in the form of `executable <sub_command_name> <positional_value>`
 */
export default interface Positional extends SubCommandArgument {

    /**
     * If this is `true` the argument can specified one or multiple times and all values will be returned in
     * an array matching the order provided.
     *
     * Note that if [[Positional.isVarArgOptional]] is `true`, the argument can specified zero, one or multiple times.
     *
     * **NOTE**: There can be only one positional with this set and it must be the last the last item if there
     * are multiple positionals defined.
     */
    readonly isVarArgMultiple?: boolean;

    /**
     * If this is `true` the argument can be specified zero or once i.e. it does not need to be specified.
     *
     * Note that if [[Positional.isVarArgMultiple]] is `true`, the argument can specified zero, one or multiple times.
     *
     * **NOTE**: There can be only one positional with this set and it must be the last the last item if there
     * are multiple positionals defined.
     */
    readonly isVarArgOptional?: boolean;
}
