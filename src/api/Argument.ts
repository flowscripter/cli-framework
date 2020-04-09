/**
 * @module @flowscripter/cli-framework-api
 */

import { ArgumentValueTypeName, ArgumentSingleValueType } from './ArgumentValueType';

/**
 * Interface to be implemented by all [[Command]] arguments.
 */
export default interface Argument {

    /**
     * Name of the argument.
     *
     * Must consist of alphanumeric non-whitespace ASCII characters or `_` and `-` characters. Cannot start with `-`.
     */
    readonly name: string;

    /**
     * Optional type of the argument value.
     *
     * If not specified the default is [[ArgumentValueTypeName.String]].
     */
    readonly type?: ArgumentValueTypeName;

    /**
     * Optional list of values that the specified value must match.
     */
    readonly validValues?: ReadonlyArray<ArgumentSingleValueType>;
}
