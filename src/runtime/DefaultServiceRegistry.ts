/**
 * @module @flowscripter/cli-framework
 */

import Service from '../api/Service';
import ServiceRegistry from '../api/ServiceRegistry';

/**
 * Default implementation of a [[ServiceRegistry]].
 */
export default class DefaultServiceRegistry implements ServiceRegistry {

    private readonly servicesById: Map<string, Service> = new Map<string, Service>();

    private readonly services = new Array<Service>();

    /**
     * @inheritdoc
     */
    public addService(service: Service): void {
        if (this.servicesById.get(service.id)) {
            throw new Error(`Duplicate service ID: ${service.id}!`);
        }
        this.servicesById.set(service.id, service);
        this.services.push(service);
        this.services.sort((a, b) => (a.initPriority >= b.initPriority ? 1 : 0));
    }

    /**
     * @inheritdoc
     */
    public getServiceById(id: string): Service | undefined {

        return this.servicesById.get(id);
    }

    /**
     * @inheritdoc
     */
    public getServices(): Iterable<Service> {
        return this.services;
    }
}
