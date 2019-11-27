import { Level, PrinterService } from '../../../src/core/service/PrinterService';

const mockLog = jest.fn();

jest.mock('console', () => ({
    // eslint-disable-next-line object-shorthand
    Console: function constructor() {
        return {
            log: mockLog
        };
    }
}));

describe('PrinterService test', () => {

    beforeEach(() => {
        mockLog.mockClear();
    });

    test('PrinterService is instantiable', () => {
        expect(new PrinterService()).toBeInstanceOf(PrinterService);
    });

    test('Level filtering works', () => {
        const ps = new PrinterService();
        ps.colorEnabled = false;

        ps.info('hello info 1');
        ps.debug('hello debug');

        expect(mockLog).toHaveBeenLastCalledWith('hello info 1');
        expect(mockLog).toHaveBeenCalledTimes(1);

        ps.setLevel(Level.WARN);

        ps.warn('hello warn');
        ps.info('hello info 2');

        expect(mockLog).toHaveBeenLastCalledWith('hello warn');
        expect(mockLog).toHaveBeenCalledTimes(2);
    });
});
