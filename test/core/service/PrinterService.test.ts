import { mockProcessStdout } from 'jest-mock-process';

import { Level, PrinterService } from '../../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();

describe('PrinterService test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('PrinterService is instantiable', () => {
        expect(new PrinterService(process.stdout)).toBeInstanceOf(PrinterService);
    });

    test('Level filtering works', () => {
        const ps = new PrinterService(process.stdout);
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
