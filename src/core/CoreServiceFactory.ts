/**
 * @module @flowscripter/cli-framework
 */

import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { PrinterService } from './service/PrinterService';

export default class CoreServiceFactory implements ServiceFactory<string> {

    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service<string>> {
        return [
            new PrinterService()
        ];
    }
}
