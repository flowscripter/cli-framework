import { mockProcessExit, mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import NodeCLI from '../../src/cli/NodeCLI';
import Command, { CommandArgs } from '../../src/api/Command';
import Context from '../../src/api/Context';
import { Printer, STDOUT_PRINTER_SERVICE } from '../../src';
import SubCommand from '../../src/api/SubCommand';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('NodeCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('NodeCLI is instantiable', () => {
        expect(new NodeCLI()).toBeInstanceOf(NodeCLI);
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
                const printer = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
                const message = commandArgs.message as string[];
                printer.info(message.join(' '));
            }
        };

        process.argv = ['node', 'node.js', 'greeter', 'hello', 'world'];

        const mockExit = mockProcessExit();
        const cli = new NodeCLI();

        cli.addCommandFactory({
            getCommands: (): Iterable<Command> => [subCommand]
        });
        await cli.execute();

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with no command exits with 0', async () => {

        process.argv = ['node', 'node.js'];

        const mockExit = mockProcessExit();
        const cli = new NodeCLI();

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with invalid command exits with 1', async () => {

        process.argv = ['node', 'node.js', 'blah'];

        const mockExit = mockProcessExit();
        const cli = new NodeCLI();

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
