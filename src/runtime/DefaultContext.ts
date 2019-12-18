/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import Context from '../api/Context';
import Service from '../api/Service';
import { CommandArgs } from '../api/Command';

/**
 * Default implementation of a [[Context]].
 */
export default class DefaultContext implements Context {

    private readonly servicesById: Map<string, Service> = new Map<string, Service>();

    public readonly commandConfigs: Map<string, CommandArgs> = new Map();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly serviceConfigs: Map<string, any> = new Map();

    /**
     * Add the specified [[Service]] instance to this [[Context]].
     *
     * @param service the [[Service]] to add.
     *
     * @throws *Error* if the specified [[Service]] has an ID duplicating an already added [[Service]]
     */
    public addService(service: Service): void {
        if (!_.isUndefined(this.servicesById.get(service.id))) {
            throw new Error(`Service with ID: ${service.id} has already been added!`);
        }
        this.servicesById.set(service.id, service);
    }

    /**
     * @inheritdoc
     */
    public getService(id: string): Service | null {

        const service = this.servicesById.get(id);

        if (_.isUndefined(service)) {
            return null;
        }
        return service;
    }
}
