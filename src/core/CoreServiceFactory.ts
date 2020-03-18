/**
 * @module @flowscripter/cli-framework
 */

import { Writable } from 'stream';
import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { StdoutPrinterService, StderrPrinterService } from './service/PrinterService';
import { PrompterService } from './service/PrompterService';
import { ConfigurationService } from './service/ConfigurationService';

/**
 * Provides core commands.
 */
export default class CoreServiceFactory implements ServiceFactory {

    private readonly stdoutWritable: Writable;

    private readonly stderrWritable: Writable;

    public readonly stderrPrinterService: StderrPrinterService;

    /**
     * @param stdoutWritable a writable provided to the [[StdoutPrinterService]] implementation
     * @param stderrWritable a writable provided to the [[StderrPrinterService]] implementation
     */
    public constructor(stdoutWritable: Writable, stderrWritable: Writable) {
        this.stdoutWritable = stdoutWritable;
        this.stderrWritable = stderrWritable;
        this.stderrPrinterService = new StderrPrinterService(this.stderrWritable, 80);
    }

    /**
     * @inheritdoc
     */
    public getServices(): Iterable<Service> {
        return [
            new StdoutPrinterService(this.stdoutWritable, 80),
            this.stderrPrinterService,
            new PrompterService(70),
            new ConfigurationService(90)
        ];
    }
}
