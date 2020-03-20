/**
 * @module @flowscripter/cli-framework
 */

import { Readable, Writable } from 'stream';
import ServiceFactory from '../api/ServiceFactory';
import Service from '../api/Service';
import { StdoutPrinterService, StderrPrinterService } from './service/PrinterService';
import { PrompterService } from './service/PrompterService';
import { ConfigurationService } from './service/ConfigurationService';

/**
 * Provides core commands.
 */
export default class CoreServiceFactory implements ServiceFactory {

    private readonly readable: Readable;

    private readonly stdoutWritable: Writable;

    private readonly stderrWritable: Writable;

    public readonly stderrPrinterService: StderrPrinterService;

    /**
     * @param readable a Readable provided to the [[PrompterService]] implementation
     * @param stdoutWritable a Writable provided to the [[StdoutPrinterService]] implementation
     * @param stderrWritable a Writable provided to the [[StderrPrinterService]] implementation
     */
    public constructor(readable: Readable, stdoutWritable: Writable, stderrWritable: Writable) {
        this.readable = readable;
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
            new PrompterService(this.readable, this.stdoutWritable, 70),
            new ConfigurationService(90)
        ];
    }
}
