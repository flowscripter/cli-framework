/**
 * @module @flowscripter/cli-framework
 */

import Argument from './Argument';

/**
 * Interface for positional arguments for a [[Command]].
 *
 * This will be used for invocation in the form of `executable command <name>`
 *
 * @typeparam TYPE is the type of the value to be parsed for this [[Parameter]].
 */
export default interface Parameter<TYPE extends ArgumentValueType> extends Argument<TYPE> {

    /**
     * If this is `true` the option can be specified multiple times and all values will be returned in an array
     * matching the order provided.
     *
     * NOTE: This is effectively a *varargs* parameter and must therefore be the only parameter with this set
     * and must appear as the last entry in [[Command.parameters]].
     */
    readonly array: boolean;
}
