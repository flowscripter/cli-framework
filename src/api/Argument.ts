/**
 * @module @flowscripter/cli-framework
 */

/**
 * Enum of possible [[Argument]] value types
 */
export enum ArgumentValueTypeName {
    String = 'STRING',
    Number = 'NUMBER',
    Boolean = 'BOOLEAN'
}

/**
 * Interface to be implemented by all [[Command]] arguments.
 */
export default interface Argument {

    /**
     * Name of the argument.
     *
     * Must consist of alphanumeric non-whitespace ASCII characters or `_` and `-` characters.
     * Cannot start with `-`.
     */
    readonly name: string;

    /**
     * Type of the argument value.
     *
     * If not specified the default is [[ArgumentValueTypeName.String]].
     */
    readonly type?: ArgumentValueTypeName;

    /**
     * Optional description of the argument.
     */
    readonly description?: string;

    /**
     * Optional list of values that the argument value must match.
     */
    readonly validValues?: ReadonlyArray<ArgumentSingleValueType>;
}
