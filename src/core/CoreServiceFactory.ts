/**
 * @module @flowscripter/cli-framework
 */

import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { StdoutPrinterService, StderrPrinterService } from './service/PrinterService';
import { PrompterService } from './service/PrompterService';
import { ConfigurationService } from './service/ConfigurationService';

/**
 * Provides core services.
 */
export default class CoreServiceFactory implements ServiceFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [
            new StdoutPrinterService(80),
            new StderrPrinterService(80),
            new PrompterService(70),
            new ConfigurationService(90)
        ];
    }
}
