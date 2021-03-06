import { mockProcessExit, mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import SimpleSingleCommandNodeCLI from '../../src/cli/SimpleSingleCommandNodeCLI';
import SubCommandA from '../fixtures/SubCommandA';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('SimpleSingleCommandNodeCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('SimpleSingleCommandNodeCLI is instantiable', () => {
        expect(new SimpleSingleCommandNodeCLI(new SubCommandA(),
            'foo')).toBeInstanceOf(SimpleSingleCommandNodeCLI);
    });

    test('Basic execution works', async () => {
        process.argv = ['node', 'node.js'];

        const mockExit = mockProcessExit();
        const cli = new SimpleSingleCommandNodeCLI(new SubCommandA(), 'foo');
        await cli.execute();

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo --help'));
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('Basic execution with global help', async () => {

        process.argv = ['node', 'node.js', '--help'];

        const mockExit = mockProcessExit();
        const cli = new SimpleSingleCommandNodeCLI(new SubCommandA());

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
