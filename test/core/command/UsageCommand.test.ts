import { mockProcessStdout } from 'jest-mock-process';
import UsageCommand from '../../../src/core/command/UsageCommand';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';
import DefaultContext from '../../../src/runtime/DefaultContext';
import GlobalCommand from '../../../src/api/GlobalCommand';

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
        const service = new StdoutPrinterService(100);
        const context = new DefaultContext({
            stdout: process.stdout,
            name: 'foo',
            description: 'bar'
        }, [service], [], new Map(), new Map());
        service.init(context);
        const usageCommand = new UsageCommand(getGlobalCommand());

        await usageCommand.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Try running'));
    });
});
