import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import { StdoutPrinterService, StderrPrinterService } from '../../../src/core/service/PrinterService';
import DefaultContext from '../../../src/runtime/DefaultContext';
import NoColorCommand from '../../../src/core/command/NoColorCommand';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('NoColorCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('NoColorCommand is instantiable', () => {
        expect(new NoColorCommand(100)).toBeInstanceOf(NoColorCommand);
    });

    test('Disabling color works', async () => {
        const stdoutService = new StdoutPrinterService(process.stdout, 90);
        const stderrService = new StderrPrinterService(process.stderr, 90);
        const context = new DefaultContext({}, [stdoutService, stderrService], [], new Map(), new Map());
        const noColorCommand = new NoColorCommand(100);

        expect(stdoutService.colorEnabled).toEqual(true);
        expect(stderrService.colorEnabled).toEqual(true);

        await noColorCommand.run({ value: true }, context);

        expect(stdoutService.colorEnabled).toEqual(false);
        expect(stderrService.colorEnabled).toEqual(false);

        await noColorCommand.run({ value: false }, context);

        expect(stdoutService.colorEnabled).toEqual(true);
        expect(stderrService.colorEnabled).toEqual(true);
    });
});
