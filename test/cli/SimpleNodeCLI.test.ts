import { mockProcessExit, mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import SimpleNodeCLI from '../../src/cli/SimpleNodeCLI';
import Command, { CommandArgs } from '../../src/api/Command';
import Context from '../../src/api/Context';
import { Printer, STDOUT_PRINTER_SERVICE } from '../../src';
import SubCommand from '../../src/api/SubCommand';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('SimpleNodeCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('SimpleNodeCLI is instantiable', () => {
        expect(new SimpleNodeCLI()).toBeInstanceOf(SimpleNodeCLI);
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
        const cli = new SimpleNodeCLI();

        cli.addCommandFactory({
            getCommands: (): Iterable<Command> => [subCommand]
        });
        await cli.execute();

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution works with custom name', async () => {
        process.argv = ['node', 'node.js', 'greeter', 'hello', 'world'];

        const mockExit = mockProcessExit();
        const cli = new SimpleNodeCLI('foo1');

        await cli.execute();

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo1 --help'));
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with no command exits with 0', async () => {

        process.argv = ['node', 'node.js'];

        const mockExit = mockProcessExit();
        const cli = new SimpleNodeCLI();

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with global help', async () => {

        process.argv = ['node', 'node.js', '--help'];

        const mockExit = mockProcessExit();
        const cli = new SimpleNodeCLI();

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with sub-command help and help subject', async () => {

        process.argv = ['node', 'node.js', 'help', 'greeter'];

        const mockExit = mockProcessExit();
        const cli = new SimpleNodeCLI();

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

        cli.addCommandFactory({
            getCommands: (): Iterable<Command> => [subCommand]
        });

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with invalid command exits with 1', async () => {

        process.argv = ['node', 'node.js', 'blah'];

        const mockExit = mockProcessExit();
        const cli = new SimpleNodeCLI();

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
