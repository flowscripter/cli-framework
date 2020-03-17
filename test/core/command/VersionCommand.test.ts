import { mockProcessStdout } from 'jest-mock-process';
import VersionCommand from '../../../src/core/command/VersionCommand';
import DefaultContext from '../../../src/runtime/DefaultContext';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();

describe('VersionCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('VersionCommand is instantiable', () => {
        expect(new VersionCommand('1.0.0')).toBeInstanceOf(VersionCommand);
    });

    test('VersionCommand works', async () => {
        const service = new StdoutPrinterService(process.stdout, 100);
        const context = new DefaultContext({}, [service], [], new Map(), new Map());
        const versionCommand = new VersionCommand('1.2.3');

        await versionCommand.run({}, context);
        expect(mockStdout).toHaveBeenLastCalledWith('1.2.3');
    });
});
