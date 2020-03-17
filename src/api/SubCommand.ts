/**
 * @module @flowscripter/cli-framework
 */

import Command from './Command';
import Positional from './Positional';
import Option from './Option';

/**
 * A definition of a single usage example of a [[SubCommand]] (to support output of CLI help).
 */
export interface UsageExample {

    /**
     * The example arguments used to generate an example invocation (this should just be the arguments following the
     * command).
     */
    readonly exampleArguments: string;

    /**
     * Optional description of the command example.
     */
    readonly description?: string;

    /**
     * Optional output result of running the example command.
     */
    readonly output?: string[];
}

/**
 * Interface to be implemented by a sub-command implementation.
 */
export default interface SubCommand extends Command {

    /**
     * Option arguments for the sub-command.
     *
     * These will be used for invocation in the form of `executable <sub_command_name> --<option_name>=<option_value>`
     */
    readonly options: ReadonlyArray<Option>;

    /**
     * Positional arguments for the sub-command.
     *
     * These will be used for invocation in the form of `executable <sub_command_name> <positional_value>`
     */
    readonly positionals: ReadonlyArray<Positional>;

    /**
     * Optional grouping topic of the command (to support output of CLI help).
     */
    readonly topic?: string;

    /**
     * Optional usage examples for the command (to support output of CLI help).
     */
    readonly usageExamples?: UsageExample[];
}
