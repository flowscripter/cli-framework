/**
 * @module @flowscripter/cli-framework
 */

export type ArgumentSingleValueType = number | string | boolean;

/**
 * The type of the value to be parsed as an argument can be: `boolean`, `number` or `string` or an array of these.
 */
export type ArgumentValueType = ArgumentSingleValueType | ArgumentSingleValueType[];

/**
 * Enum of possible [[Argument]] value types
 */

// eslint-disable-next-line import/prefer-default-export
export enum ArgumentValueTypeName {
    String = 'STRING',
    Number = 'NUMBER',
    Boolean = 'BOOLEAN'
}
