/**
 * @module @flowscripter/cli-framework-api
 */

import { PluginManager } from '@flowscripter/esm-dynamic-plugins';

/**
 * Type alias for a PluginManager class
 */
// eslint-disable-next-line import/prefer-default-export
export type PluginManagerClass = new (paths: Array<string>) => PluginManager<string>;
