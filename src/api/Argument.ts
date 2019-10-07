/**
 * @module @flowscripter/cli-framework
 */

/**
 * Interface to be implemented by all [[Command]] arguments.
 *
 * @typeparam TYPE is the type of the value to be parsed for this [[Argument]].
 */
export default interface Argument<TYPE extends ArgumentValueType> {

    /**
     * Name of the argument.
     *
     * Will always be lowercase with only alphanumeric non-whitespace ASCII or `_` and `-` characters.
     */
    readonly name: string;

    /**
     * Default value for the argument if not specified.
     */
    readonly default: TYPE | undefined;

    /**
     * If this is `true` the argument must be populated with a value either by being specified,
     * having a default or being preset in configuration.
     */
    readonly required: boolean;

    /**
     * Description of the argument.
     */
    readonly description: string | undefined;

    /**
     * Optional list of values that the argument value must match.
     */
    readonly choices: TYPE[] | undefined;
}
