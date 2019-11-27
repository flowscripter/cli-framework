/**
 * @module @flowscripter/cli-framework
 */

import Context from '../api/Context';
import Service from '../api/Service';
import ServiceFactory from '../api/ServiceFactory';

/**
 * Default implementation of a [[Context]].
 *
 * This implementation manages a list of provided [[ServiceFactory]] instances which are
 * accessed lazily to search for a [[Service]] when [[getService]] is invoked.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default class DefaultContext<S_ID> implements Context<S_ID> {

    private readonly unloadedServiceFactories: ServiceFactory<S_ID>[] = [];

    private readonly servicesById: Map<S_ID, Service<S_ID>> = new Map<S_ID, Service<S_ID>>();

    /**
     * Add the specified [[ServiceFactory]] instance to this [[Context]].
     *
     * @param serviceFactory the [[ServiceFactory]] to add.
     */
    public addServiceFactory(serviceFactory: ServiceFactory<S_ID>): void {
        this.unloadedServiceFactories.push(serviceFactory);
    }

    /**
     * @inheritdoc
     */
    public getService(serviceId: S_ID): Service<S_ID> | null {

        let foundService = this.servicesById.get(serviceId);

        if (foundService !== undefined) {
            return foundService;
        }

        foundService = undefined;

        while (this.unloadedServiceFactories.length > 0) {

            const serviceFactory = this.unloadedServiceFactories.pop();

            if (serviceFactory !== undefined) {
                for (const service of serviceFactory.getServices()) {
                    this.servicesById.set(service.serviceId, service);
                    if (service.serviceId === serviceId) {
                        foundService = service;
                    }
                }
            }
            if (foundService !== undefined) {
                return foundService;
            }
        }
        return null;
    }
}
