/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';

/**
 * Interface to be implemented by all [[SubCommand]] arguments.
 */
export default interface SubCommandArgument extends Argument {

    /**
     * Optional description of the argument.
     */
    readonly description?: string;
}
