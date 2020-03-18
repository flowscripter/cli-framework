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
        expect(new HelpGlobalCommand('foo', 'make it foo bar', '1.2.3')).toBeInstanceOf(HelpGlobalCommand);
    });

    test('HelpSubCommand is instantiable', () => {
        expect(new HelpSubCommand('foo', 'make it foo bar', '1.2.3')).toBeInstanceOf(HelpSubCommand);
    });

    test('HelpGlobalCommand works', async () => {
        const help = new HelpGlobalCommand('foo', 'make it foo bar', '1.2.3');
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help], new Map(), new Map());

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpSubCommand works', async () => {
        const help = new HelpSubCommand('foo', 'make it foo bar', '1.2.3');
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help], new Map(), new Map());

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpGlobalCommand with command specified works', async () => {
        const help = new HelpGlobalCommand('foo', 'make it foo bar', '1.2.3');
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help, commandA], new Map(), new Map());

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpSubCommand with command specified works', async () => {
        const help = new HelpSubCommand('foo', 'make it foo bar', '1.2.3');
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help, commandA], new Map(), new Map());

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpGlobalCommand with unknown command specified displays warning and generic help', async () => {
        const help = new HelpGlobalCommand('foo', 'make it foo bar', '1.2.3');
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help], new Map(), new Map());

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });

    test('HelpSubCommand with unknown command specified displays warning and generic help', async () => {
        const help = new HelpSubCommand('foo', 'make it foo bar', '1.2.3');
        const stdoutService = new StdoutPrinterService(process.stdout, 100);
        stdoutService.colorEnabled = false;
        const context = new DefaultContext({}, [stdoutService], [help], new Map(), new Map());

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('make it foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage:'));
    });
});
