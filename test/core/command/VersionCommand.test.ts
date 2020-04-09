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
        expect(new VersionCommand()).toBeInstanceOf(VersionCommand);
    });

    test('VersionCommand works', async () => {
        const service = new StdoutPrinterService(100);
        const context = new DefaultContext({
            stdout: process.stdout,
            version: '1.2.3'
        }, [service], [], new Map(), new Map());
        service.init(context);
        const versionCommand = new VersionCommand();

        await versionCommand.run({}, context);
        expect(mockStdout).toHaveBeenLastCalledWith('1.2.3');
    });
});
