/**
 * @module @flowscripter/cli-framework
 */

import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { PluginRegistryService } from './service/PluginRegistryService';


/**
 * Provides a [[PluginRegistry]] [[Service]].
 */
export default class PluginServiceFactory implements ServiceFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [
            new PluginRegistryService(60)
        ];
    }
}
