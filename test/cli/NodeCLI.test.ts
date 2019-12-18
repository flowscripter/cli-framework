import os from 'os';
import mock, * as mockFs from 'mock-fs';
import yaml from 'js-yaml';
import { mockProcessExit, mockProcessStdout } from 'jest-mock-process';
import NodeCLI from '../../src/cli/NodeCLI';
import Command, { CommandArgs } from '../../src/api/Command';
import Context from '../../src/api/Context';
import { PRINTER_SERVICE, PrinterService } from '../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getYamlFromMap(map: Map<string, any>): string {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });

    return yaml.dump(obj);
}

describe('NodeCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    afterEach(() => {
        mockFs.restore();
        delete process.env.CLI_CONFIG;
    });

    test('NodeCLI is instantiable', () => {
        expect(new NodeCLI()).toBeInstanceOf(NodeCLI);
    });

    test('Read from default config location', () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = new Map<string, any>([['foo', 'bar']]);

        mock({
            [`${os.homedir()}/.cli.yaml`]: getYamlFromMap(config)
        });

        const cli = new NodeCLI();

        expect(cli.configuration).toEqual(config);
    });

    test('Read from custom config location', () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = new Map<string, any>([['foo', 'bar']]);

        process.env.CLI_CONFIG = '/cli.yaml';

        mock({
            '/cli.yaml': getYamlFromMap(config)
        });

        const cli = new NodeCLI();

        expect(cli.configuration).toEqual(config);
    });

    test('Error on config file is a directory', () => {

        mock({
            [`${os.homedir()}/.cli.yaml`]: {
                fileA: 'hello'
            }
        });

        const mockExit = mockProcessExit();
        // eslint-disable-next-line no-new
        new NodeCLI();

        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('Error on config file is invalid', () => {

        mock({
            [`${os.homedir()}/.cli.yaml`]: ''
        });

        const mockExit = mockProcessExit();
        // eslint-disable-next-line no-new
        new NodeCLI();

        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('Error on config file is not readable', () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = new Map<string, any>([['foo', 'bar']]);

        mock({
            [`${os.homedir()}/.cli.yaml`]: mock.file({
                content: getYamlFromMap(config),
                mode: 0o0
            })
        });

        const mockExit = mockProcessExit();
        // eslint-disable-next-line no-new
        new NodeCLI();

        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('Default config file not readable is not an error', () => {

        mock({});

        const cli = new NodeCLI();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(cli.configuration).toEqual(new Map<string, any>());
    });

    test('Custom config file not readable is an error', () => {

        process.env.CLI_CONFIG = '/cli.yaml';

        mock({});

        const mockExit = mockProcessExit();
        // eslint-disable-next-line no-new
        new NodeCLI();

        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('Basic execution works', async () => {

        process.argv = ['node', 'node.js', 'hello', 'world'];

        const cli = new NodeCLI();

        cli.addCommandFactory({
            getCommands: (): Iterable<Command> => [{
                name: 'greeter',
                isDefault: true,
                positionals: [{
                    name: 'message',
                    isVarArg: true
                }],
                run: async (commandArgs: CommandArgs, context: Context): Promise<void> => {
                    const printer = context.getService(PRINTER_SERVICE) as PrinterService;
                    const message = commandArgs.message as string[];
                    printer.info(message.join(' '));
                }
            }]
        });
        await cli.execute();

        expect(mockStdout).toHaveBeenLastCalledWith('hello world');
    });

    test('Basic execution with no command found throws', async () => {

        process.argv = ['node', 'node.js', 'hello', 'world'];

        const cli = new NodeCLI();

        await expect(cli.execute()).rejects.toThrowError();
    });
});
