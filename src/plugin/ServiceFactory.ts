/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import Service from '../api/Service';
import Context from '../api/Context';

export const SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID = 'service_factory_plugin_extension_point';

const log: debug.Debugger = debug('ServiceFactory');

export async function handleLoadedServiceFactory(serviceFactory: ServiceFactory, context: Context): Promise<void> {
    for (const service of serviceFactory.getServices()) {
        if (context.serviceRegistry.getServiceById(service.id)) {
            log(`Skipping service with duplicate ID ${service.id}`);
        } else {
            context.serviceRegistry.addService(service);

            // eslint-disable-next-line no-await-in-loop
            await service.init(context);
        }
    }
}

/**
 * Extension interface used by a [[CLI]] to load [[Service]] implementations from an
 * esm-dynamic-plugins plugin implementation.
 */
export default interface ServiceFactory {

    /**
     * Return all [[Service]] instances supplied by this factory.
     *
     * @return iterable of [[Service]] instances
     */
    getServices(): Iterable<Service>;
}
