/**
 * @module @flowscripter/cli-framework-api
 */

import Command from './Command';
import GlobalCommandArgument from './GlobalCommandArgument';

/**
 * Interface to be implemented by a global command implementation.
 */
export default interface GlobalCommand extends Command {

    /**
     * Optional short alias for the global command.
     *
     * This will be used for invocation in the form of `executable -<global_command_short_alias> <argument>`
     *
     * Must consist of a single alphanumeric non-whitespace ASCII character.
     */
    readonly shortAlias?: string;

    /**
     * Optional argument for the global command.
     *
     * If defined, an argument for the global command is expected e.g.
     *
     * `executable --<global_command_name> [global_command_argument]`
     *
     * If not defined, no argument is expected e.g.
     *
     * `executable --<global_command_name>`
     */
    readonly argument?: GlobalCommandArgument;
}
