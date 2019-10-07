/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';

/**
 * Interface for non-positional arguments for a [[Command]].
 *
 * This will be used for invocation in the form of `executable command --<name>`
 *
 * @typeparam TYPE is the type of the value to be parsed for this [[Option]].
 */
export default interface Option<TYPE extends ArgumentValueType> extends Argument<TYPE> {

    /**
     * Short alias for the option.
     *
     * This will be used for invocation in the form of `executable command -<shortAlias>`
     *
     * Will always be lowercase with only alphanumeric non-whitespace ASCII or `_` and `-` characters.
     */
    readonly shortAlias: string | undefined;

    /**
     * If this is `true` the option can be specified multiple times and all values will be returned in an array
     * matching the order provided.
     */
    readonly array: boolean;
}
