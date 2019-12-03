/**
 * @module @flowscripter/cli-framework
 */

import { Writable } from 'stream';

import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { PrinterService } from './service/PrinterService';

export default class CoreServiceFactory implements ServiceFactory {

    private readonly writable: Writable;

    public constructor(writable: Writable) {
        this.writable = writable;
    }

    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [
            new PrinterService(this.writable)
        ];
    }
}
