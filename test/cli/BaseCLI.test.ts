import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import CommandFactoryA from '../fixtures/CommandFactoryA';
import ServiceFactoryA, { SERVICE_ID_A } from '../fixtures/ServiceFactoryA';
import BaseCLI from '../../src/cli/BaseCLI';
import { RunResult, STDERR_PRINTER_SERVICE } from '../../src';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('BaseCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('BaseCLI is instantiable', () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        expect(new BaseCLI(cliConfig)).toBeInstanceOf(BaseCLI);
    });

    test('ServiceFactory is registered', () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const cli = new BaseCLI(cliConfig);

        expect(cli.serviceFactories).toHaveLength(1);

        cli.addServiceFactory(new ServiceFactoryA());

        expect(cli.serviceFactories).toHaveLength(2);
    });

    test('Custom factories added', () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const serviceFactory = new ServiceFactoryA();
        const commandFactory = new CommandFactoryA();
        const cli = new BaseCLI(cliConfig, new Map(), new Map(), [serviceFactory], [commandFactory]);

        expect(cli.serviceFactories).toHaveLength(1);
        expect(cli.serviceFactories[0]).toEqual(serviceFactory);
        expect(cli.commandFactories).toHaveLength(1);
        expect(cli.commandFactories[0]).toEqual(commandFactory);
    });

    test('No default factories added', () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const cli = new BaseCLI(cliConfig, new Map(), new Map(), [], []);

        expect(cli.serviceFactories).toHaveLength(0);
        expect(cli.commandFactories).toHaveLength(0);
    });

    test('CommandFactory is registered', () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const cli = new BaseCLI(cliConfig);

        expect(cli.commandFactories).toHaveLength(1);

        cli.addCommandFactory(new CommandFactoryA());

        expect(cli.commandFactories).toHaveLength(2);
    });

    test('Default command is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
    });

    test('Global help command is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['--help']);
        expect(result).toEqual(RunResult.Success);
    });

    test('Global help command with argument is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['--help=command_a']);
        expect(result).toEqual(RunResult.Success);
    });

    test('Non-global help command is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['help']);
        expect(result).toEqual(RunResult.Success);
    });

    test('Non-global help command with argument matching command name is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['help', 'command_a']);
        expect(result).toEqual(RunResult.Success);
    });

    test('Global modifier and non-global help command with argument is run', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['--color', 'help', 'command_a']);
        expect(result).toEqual(RunResult.Success);
    });

    test('Warning for unknown command', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const serviceConfigs = new Map();
        serviceConfigs.set(STDERR_PRINTER_SERVICE, { colorEnabled: false });
        const cli = new BaseCLI(cliConfig, serviceConfigs, new Map());

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['blah']);
        expect(result).toEqual(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: blah'));
    });

    test('Warning for unknown global argument', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const serviceConfigs = new Map();
        serviceConfigs.set(STDERR_PRINTER_SERVICE, { colorEnabled: false });
        const cli = new BaseCLI(cliConfig, serviceConfigs, new Map());

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['--nnn', 'command_a', '--foo=hello']);
        expect(result).toEqual(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: --nnn'));
    });

    test('Default command is run with required arguments provided in config', async () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const commandConfigs = new Map<string, any>();
        commandConfigs.set('command_a', {
            foo: 'bar'
        });

        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
            commandConfigs
        };

        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
    });

    test('Service is configured with provided config', async () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(SERVICE_ID_A, {
            foo: 'bar'
        });

        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
        };

        const serviceFactoryA = new ServiceFactoryA();

        const cli = new BaseCLI(cliConfig, serviceConfigs);

        cli.addServiceFactory(serviceFactoryA);

        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
        expect(serviceFactoryA.serviceA.config.foo).toEqual('bar');
    });
});
