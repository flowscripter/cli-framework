import { mockProcessExit, mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import { CommandArgs } from '../../src/api/Command';
import Context from '../../src/api/Context';
import Printer, { STDOUT_PRINTER_SERVICE } from '../../src/core/service/PrinterService';
import { PluginManagerConfig, PLUGIN_REGISTRY_SERVICE } from '../../src/plugin/service/PluginRegistryService';
import SubCommand from '../../src/api/SubCommand';
import AdvancedMultiCommandNodeCLI from '../../src/cli/AdvancedMultiCommandNodeCLI';

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

    test('AdvancedMultiCommandNodeCLI is instantiable', () => {
        expect(new AdvancedMultiCommandNodeCLI([], [], new Map(), new Map(),
            'foo')).toBeInstanceOf(AdvancedMultiCommandNodeCLI);
    });

    test('Default command execution works', async () => {
        process.argv = ['node', 'node.js'];

        const mockExit = mockProcessExit();
        const cli = new AdvancedMultiCommandNodeCLI([], [], new Map(), new Map(), 'foo');
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
        const cli = new AdvancedMultiCommandNodeCLI([], [subCommand], new Map(), new Map(), 'foo');
        await cli.execute();

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with global help', async () => {

        process.argv = ['node', 'node.js', '--help'];

        const mockExit = mockProcessExit();
        const cli = new AdvancedMultiCommandNodeCLI([], [], new Map(), new Map(), 'foo');
        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with customised plugin registry config', async () => {

        process.argv = ['node', 'node.js', '--help'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            moduleScope: '@flowscripter',
            pluginLocation: '/tmp/plugins'
        } as PluginManagerConfig);

        const mockExit = mockProcessExit();
        const cli = new AdvancedMultiCommandNodeCLI([], [], serviceConfigs, new Map(), 'foo');
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
        const cli = new AdvancedMultiCommandNodeCLI([], [subCommand], new Map(), new Map(), 'foo');

        await cli.execute();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('Basic execution with invalid command', async () => {

        process.argv = ['node', 'node.js', 'blah'];

        const mockExit = mockProcessExit();
        const cli = new AdvancedMultiCommandNodeCLI([], [], new Map(), new Map(), 'foo');

        await cli.execute();
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo --help'));
        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
