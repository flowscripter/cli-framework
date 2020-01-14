/**
 * @module @flowscripter/cli-framework
 */

import Service from '../../api/Service';

export const PLUGIN_REGISTRY_SERVICE = '@flowscripter/cli-framework/plugin-registry-service';

// TODO: implement
/**
 * TODO: docs
 * Interface to be implemented by a [[Service]] allowing a [[Command]] to prompt the user for further input while
 * it is running.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface PluginRegistry {
}

/**
 * Core implementation of [[PluginRegistry]] exposed as a [[Service]].
 */
export class PluginRegistryService implements Service, PluginRegistry {

    readonly id = PLUGIN_REGISTRY_SERVICE;

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,class-methods-use-this,@typescript-eslint/no-unused-vars
    public init(config?: any): void {
        // if (_.isEmpty(config)) {
        //     return;
        // }
    }
}
