/**
 * @module @flowscripter/cli-framework-api
 */

import GlobalCommand from './GlobalCommand';

/**
 * Interface to be implemented by a global modifier command implementation.
 */
export default interface GlobalModifierCommand extends GlobalCommand {

    /**
     * Used to determine the order in which multiple [[GlobalModifierCommand]] parsed from the provided
     * arguments will be run. Higher values will run before lower values.
     */
    readonly runPriority: number;
}
