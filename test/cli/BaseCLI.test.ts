import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import CommandFactoryA from '../fixtures/CommandFactoryA';
import ServiceFactoryA, { SERVICE_ID_A } from '../fixtures/ServiceFactoryA';
import BaseCLI from '../../src/cli/BaseCLI';

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

        expect(result).toEqual(0);
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

        expect(result).toEqual(0);
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

        expect(result).toEqual(0);
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

        expect(result).toEqual(0);
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

        expect(result).toEqual(0);
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

        expect(result).toEqual(0);
    });

    test('Execute failure returns 1', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['blah']);

        expect(result).toEqual(1);
    });

    test('Execute fails for unknown global argument', async () => {
        const cliConfig = {
            name: 'cli',
            description: 'good',
            version: '1.2.3',
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr,
        };
        const cli = new BaseCLI(cliConfig);

        cli.addCommandFactory(new CommandFactoryA());

        const result = await cli.execute(['--nnn', 'command_a', '--foo=hello']);

        expect(result).toEqual(1);
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

        expect(result).toEqual(0);
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
            stderr: process.stderr,
            serviceConfigs
        };

        const serviceFactoryA = new ServiceFactoryA();

        const cli = new BaseCLI(cliConfig);

        cli.addServiceFactory(serviceFactoryA);

        const result = await cli.execute([]);

        expect(result).toEqual(0);
        expect(serviceFactoryA.serviceA.config.foo).toEqual('bar');
    });
});
