import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import { StdoutPrinterService, StderrPrinterService } from '../../../src/core/service/PrinterService';
import DefaultContext from '../../../src/runtime/DefaultContext';
import ColorCommand from '../../../src/core/command/ColorCommand';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('ColorCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('ColorCommand is instantiable', () => {
        expect(new ColorCommand(100)).toBeInstanceOf(ColorCommand);
    });

    test('Forcing color works', async () => {
        const stdoutService = new StdoutPrinterService(process.stdout, 90);
        const stderrService = new StderrPrinterService(process.stderr, 90);
        const context = new DefaultContext({}, [stdoutService, stderrService], [], new Map(), new Map());
        const colorCommand = new ColorCommand(100);

        stdoutService.colorEnabled = false;
        stderrService.colorEnabled = false;

        await colorCommand.run({ }, context);

        expect(stdoutService.colorEnabled).toEqual(true);
        expect(stderrService.colorEnabled).toEqual(true);
    });
});
