import { mockProcessStdout } from 'jest-mock-process';
import { HelpGlobalCommand, HelpSubCommand } from '../../../src/core/command/HelpCommand';
import DefaultContext from '../../../src/runtime/DefaultContext';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';
import { SubCommandA } from '../../fixtures/CommandFactoryA';

const mockStdout = mockProcessStdout();

describe('HelpCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('HelpGlobalCommand is instantiable', () => {
        expect(new HelpGlobalCommand()).toBeInstanceOf(HelpGlobalCommand);
    });

    test('HelpSubCommand is instantiable', () => {
        expect(new HelpSubCommand()).toBeInstanceOf(HelpSubCommand);
    });

    test('HelpGlobalCommand works', async () => {
        const help = new HelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help], new Map(), new Map());
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpSubCommand works', async () => {
        const help = new HelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help], new Map(), new Map());
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpGlobalCommand with command specified works', async () => {
        const help = new HelpGlobalCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help, commandA], new Map(), new Map());
        stdoutService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpSubCommand with command specified works', async () => {
        const help = new HelpSubCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help, commandA], new Map(), new Map());
        stdoutService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpGlobalCommand with unknown command specified displays warning and generic help', async () => {
        const help = new HelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help], new Map(), new Map());
        stdoutService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpSubCommand with unknown command specified displays warning and generic help', async () => {
        const help = new HelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help], new Map(), new Map());
        stdoutService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpSubCommand with mistyped command specified proposes matches', async () => {
        const help = new HelpSubCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({
            name: 'foo',
            description: 'foo bar',
            version: '1.2.3',
            stdout: process.stdout
        }, [stdoutService], [help, commandA], new Map(), new Map());
        stdoutService.init(context);

        await help.run({ command: 'command_b' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Possible matches: command_a'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: command_b'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });
});
