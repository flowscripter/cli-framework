import { mockProcessExit, mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import SimpleMultiCommandNodeCLI from '../../src/cli/SimpleMultiCommandNodeCLI';
import { CommandArgs } from '../../src/api/Command';
import Context from '../../src/api/Context';
import SubCommand from '../../src/api/SubCommand';
import Printer, { STDOUT_PRINTER_SERVICE } from '../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('SimpleMultiCommandNodeCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('SimpleMultiCommandNodeCLI is instantiable', () => {
        expect(new SimpleMultiCommandNodeCLI([], 'foo')).toBeInstanceOf(SimpleMultiCommandNodeCLI);
    });

    test('Default command execution works', async () => {
        process.argv = ['node', 'node.js'];

        const mockExit = mockProcessExit();
        const cli = new SimpleMultiCommandNodeCLI([], 'foo');
        await cli.execute();

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo --help'));
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution works', async () => {

        const subCommand: SubCommand = {
            name: 'greeter',
            options: [],
            positionals: [{
                name: 'message',
                isVarArgMultiple: true
            }],
            run: async (commandArgs: CommandArgs, context: Context): Promise<void> => {
                const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
                const message = commandArgs.message as string[];
                printer.info(message.join(' '));
            }
        };

        process.argv = ['node', 'node.js', 'greeter', 'hello', 'world'];

        const mockExit = mockProcessExit();
        const cli = new SimpleMultiCommandNodeCLI([subCommand], 'foo');
        await cli.execute();

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with global help', async () => {

        process.argv = ['node', 'node.js', '--help'];

        const mockExit = mockProcessExit();
        const cli = new SimpleMultiCommandNodeCLI([], 'foo');
        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with sub-command help and help subject', async () => {

        const subCommand: SubCommand = {
            name: 'greeter',
            options: [],
            positionals: [{
                name: 'message',
                description: 'message to output',
                isVarArgMultiple: true
            }],
            usageExamples: [
                {
                    exampleArguments: 'hello world',
                    description: 'The classic',
                    output: ['hello world']
                },
                {
                    exampleArguments: 'yo, wassup?!',
                    description: 'Something more modern',
                    output: ['yo, wassup?!']
                }
            ],
            run: async (commandArgs: CommandArgs, context: Context): Promise<void> => {
                const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
                const message = commandArgs.message as string[];
                printer.info(message.join(' '));
            }
        };

        process.argv = ['node', 'node.js', 'help', 'greeter'];

        const mockExit = mockProcessExit();
        const cli = new SimpleMultiCommandNodeCLI([subCommand], 'foo');

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with invalid command', async () => {

        process.argv = ['node', 'node.js', 'blah'];

        const mockExit = mockProcessExit();
        const cli = new SimpleMultiCommandNodeCLI([], 'foo');

        await cli.execute();
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo --help'));
        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
