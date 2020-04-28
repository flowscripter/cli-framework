import { mockProcessStdout } from 'jest-mock-process';
import VersionCommand from '../../../src/core/command/VersionCommand';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CliConfig';

const mockStdout = mockProcessStdout();

describe('VersionCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('VersionCommand is instantiable', () => {
        expect(new VersionCommand()).toBeInstanceOf(VersionCommand);
    });

    test('VersionCommand works', async () => {
        const stdoutService = new StdoutPrinterService(100);
        const context = getContext(getCliConfig(), [stdoutService], []);
        stdoutService.init(context);
        const versionCommand = new VersionCommand();

        await versionCommand.run({}, context);
        expect(mockStdout).toHaveBeenLastCalledWith('1.2.3');
    });
});
