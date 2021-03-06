import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import { StdoutPrinterService, StderrPrinterService } from '../../../src/core/service/PrinterService';
import { ColorCommand, NoColorCommand } from '../../../src/core/command/ColorCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';

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
        const stdoutService = new StdoutPrinterService(90);
        const stderrService = new StderrPrinterService(90);
        const context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        const colorCommand = new ColorCommand(100);

        stdoutService.colorEnabled = false;
        stderrService.colorEnabled = false;

        await colorCommand.run({ }, context);

        expect(stdoutService.colorEnabled).toEqual(true);
        expect(stderrService.colorEnabled).toEqual(true);
    });

    test('NoColorCommand is instantiable', () => {
        expect(new NoColorCommand(100)).toBeInstanceOf(NoColorCommand);
    });

    test('Forcing no color works', async () => {
        const stdoutService = new StdoutPrinterService(90);
        const stderrService = new StderrPrinterService(90);
        const context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        const noColorCommand = new NoColorCommand(100);

        stdoutService.colorEnabled = true;
        stderrService.colorEnabled = true;

        await noColorCommand.run({ }, context);

        expect(stdoutService.colorEnabled).toEqual(false);
        expect(stderrService.colorEnabled).toEqual(false);
    });
});
