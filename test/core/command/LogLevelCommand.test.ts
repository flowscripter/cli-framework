import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import LogLevelCommand from '../../../src/core/command/LogLevelCommand';
import { StdoutPrinterService, StderrPrinterService } from '../../../src/core/service/PrinterService';
import DefaultContext from '../../../src/runtime/DefaultContext';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('LogLevelCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('LogLevelCommand is instantiable', () => {
        expect(new LogLevelCommand(100)).toBeInstanceOf(LogLevelCommand);
    });

    test('Stdout and stderr filtering works', async () => {
        const stdoutService = new StdoutPrinterService(process.stdout, 90);
        const stderrService = new StderrPrinterService(process.stderr, 90);
        const context = new DefaultContext({}, [stdoutService, stderrService], [], new Map(), new Map());
        const logLevelCommand = new LogLevelCommand(100);

        stdoutService.colorEnabled = false;
        stderrService.colorEnabled = false;

        stdoutService.debug('foo');
        expect(mockStdout).toBeCalledTimes(0);
        stdoutService.info('bar');
        expect(mockStdout).toHaveBeenCalledWith('bar');

        stderrService.debug('foo');
        expect(mockStderr).toBeCalledTimes(0);
        stderrService.info('bar');
        expect(mockStderr).toHaveBeenCalledWith('bar');

        await logLevelCommand.run({ loglevel: 'DEBUG' }, context);

        stdoutService.debug('goo');
        expect(mockStdout).toHaveBeenLastCalledWith('goo');
        stdoutService.info('gar');
        expect(mockStdout).toHaveBeenLastCalledWith('gar');

        stderrService.debug('goo');
        expect(mockStderr).toHaveBeenLastCalledWith('goo');
        stderrService.info('gar');
        expect(mockStderr).toHaveBeenLastCalledWith('gar');

        await logLevelCommand.run({ loglevel: 'WARN' }, context);

        stdoutService.info('hoo');
        expect(mockStdout).toHaveBeenLastCalledWith('gar');
        stdoutService.warn('har');
        expect(mockStdout).toHaveBeenLastCalledWith('har');

        stderrService.info('hoo');
        expect(mockStderr).toHaveBeenLastCalledWith('gar');
        stderrService.warn('har');
        expect(mockStderr).toHaveBeenLastCalledWith('har');
    });
});
