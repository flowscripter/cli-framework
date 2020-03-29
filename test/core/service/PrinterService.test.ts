import { mockProcessStdout } from 'jest-mock-process';

import { Level, StdoutPrinterService } from '../../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();

describe('PrinterService test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('PrinterService is instantiable', () => {
        expect(new StdoutPrinterService(process.stdout, 100)).toBeInstanceOf(StdoutPrinterService);
    });

    test('Bold works (testing with color disabled)', () => {
        const ps = new StdoutPrinterService(process.stdout, 100);
        ps.colorEnabled = false;

        ps.info(`hello ${ps.bold('world')}`);

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockStdout).toHaveBeenCalledTimes(1);
    });

    test('Writable accessible', () => {
        const ps = new StdoutPrinterService(process.stdout, 100);
        ps.colorEnabled = false;

        ps.writable.write('hello world');

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockStdout).toHaveBeenCalledTimes(1);
    });

    test('Level filtering works', () => {
        const ps = new StdoutPrinterService(process.stdout, 100);
        ps.colorEnabled = false;

        ps.info('hello info 1');
        ps.debug('hello debug');

        expect(mockStdout).toHaveBeenLastCalledWith('hello info 1');
        expect(mockStdout).toHaveBeenCalledTimes(1);

        ps.setLevel(Level.WARN);

        ps.warn('hello warn');
        ps.info('hello info 2');

        expect(mockStdout).toHaveBeenLastCalledWith('hello warn');
        expect(mockStdout).toHaveBeenCalledTimes(2);
    });
});