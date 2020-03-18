/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';
import { ArgumentSingleValueType } from './ArgumentValueType';

/**
 * Interface to be implemented by a single argument supported by a [[GlobalCommand]].
 */
export default interface GlobalCommandArgument extends Argument {

    /**
     * Default value for the argument if not specified.
     */
    readonly defaultValue?: ArgumentSingleValueType;

    /**
     * If this is `true` the option does not need to be specified nor have a default value. The default is `false`.
     */
    readonly isOptional?: boolean;
}
