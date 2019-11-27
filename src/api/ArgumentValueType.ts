/**
 * @module @flowscripter/cli-framework
 */

type ArgumentSingleValueType = number | string | boolean;

/**
 * The type of the value to be parsed for an [[Argument]] can be: `boolean`, `number` or `string` or an array of these.
 */
type ArgumentValueType = ArgumentSingleValueType | ArgumentSingleValueType[];
