import { mockProcessStdout } from 'jest-mock-process';
import UsageCommand from '../../../src/core/command/UsageCommand';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';
import GlobalCommand from '../../../src/api/GlobalCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CliConfig';

const mockStdout = mockProcessStdout();

describe('UsageCommand test', () => {

    function getGlobalCommand(): GlobalCommand {
        return {
            name: 'globalCommand',
            shortAlias: 'g',
            run: async (): Promise<void> => {
                // empty
            }
        };
    }

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('UsageCommand is instantiable', () => {
        expect(new UsageCommand(getGlobalCommand())).toBeInstanceOf(UsageCommand);
    });

    test('UsageCommand works', async () => {
        const stdoutService = new StdoutPrinterService(100);
        const context = getContext(getCliConfig(), [stdoutService], []);
        stdoutService.init(context);
        const usageCommand = new UsageCommand(getGlobalCommand());

        await usageCommand.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Try running'));
    });
});
