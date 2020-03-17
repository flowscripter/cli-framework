/**
 * @module @flowscripter/cli-framework
 */

import Command from './Command';
import SubCommand from './SubCommand';

/**
 * Interface to be implemented by a group command implementation.
 */
export default interface GroupCommand extends Command {

    /**
     * Array of sub-commands for the group. Must contain at least one sub-command.
     *
     * These will be used for invocation in the form of
     * `executable <group_command_name> <member_sub_command_name> [member_sub_command_arguments]`
     */
    readonly memberSubCommands: ReadonlyArray<SubCommand>;
}
