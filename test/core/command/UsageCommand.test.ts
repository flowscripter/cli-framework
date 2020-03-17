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
        expect(new UsageCommand('foo', 'bar', getGlobalCommand())).toBeInstanceOf(UsageCommand);
    });

    test('UsageCommand works', async () => {
        const service = new StdoutPrinterService(process.stdout, 100);
        const context = new DefaultContext({}, [service], [], new Map(), new Map());
        const usageCommand = new UsageCommand('foo', 'bar', getGlobalCommand());

        await usageCommand.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith('bar');
    });
});
