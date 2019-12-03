/**
 * @module @flowscripter/cli-framework
 */

import Context from '../api/Context';
import Service from '../api/Service';

/**
 * Default implementation of a [[Context]].
 */
export default class DefaultContext implements Context {

    private readonly servicesById: Map<string, Service> = new Map<string, Service>();

    public readonly commandConfigs: Map<string, object> = new Map();

    public readonly serviceConfigs: Map<string, object> = new Map();

    /**
     * Add the specified [[Service]] instance to this [[Context]].
     *
     * @param service the [[Service]] to add.
     *
     * @throws *Error* if the specified [[Service]] has an ID duplicating an already added [[Service]]
     */
    public addService(service: Service): void {
        if (this.servicesById.get(service.id) !== undefined) {
            throw new Error(`Service with ID: ${service.id} has already been added!`);
        }
        this.servicesById.set(service.id, service);
    }

    /**
     * @inheritdoc
     */
    public getService(id: string): Service | null {

        const service = this.servicesById.get(id);

        if (service === undefined) {
            return null;
        }
        return service;
    }
}
