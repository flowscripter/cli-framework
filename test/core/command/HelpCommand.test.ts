import { mockProcessStdout } from 'jest-mock-process';
import { HelpGlobalCommand, HelpSubCommand } from '../../../src/core/command/HelpCommand';
import { StdoutPrinterService } from '../../../src/core/service/PrinterService';
import { SubCommandA } from '../../fixtures/CommandFactoryA';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import SubCommand from '../../../src/api/SubCommand';
import { CommandArgs } from '../../../src';
import Context from '../../../src/api/Context';

const mockStdout = mockProcessStdout();

class OtherCommand1 implements SubCommand {
    readonly name = 'other1';

    readonly options = [];

    readonly positionals = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        // empty
    }
}

class OtherCommand2 implements SubCommand {
    readonly name = 'other2';

    readonly options = [];

    readonly positionals = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        // empty
    }
}

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
        const context = getContext(getCliConfig(), [stdoutService], [help]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpSubCommand works', async () => {
        const help = new HelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [help]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpGlobalCommand with command specified works', async () => {
        const help = new HelpGlobalCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [help, commandA]);
        stdoutService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpSubCommand with command specified works', async () => {
        const help = new HelpSubCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [help, commandA]);
        stdoutService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpGlobalCommand with unknown command specified error warning and generic help', async () => {
        const help = new HelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [help]);
        stdoutService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpSubCommand with unknown command specified displays error and generic help', async () => {
        const help = new HelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [help]);
        stdoutService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpSubCommand with mistyped command specified proposes matches', async () => {
        const help = new HelpSubCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService], [new OtherCommand1(), help,
            commandA, new OtherCommand2()]);
        stdoutService.init(context);

        await help.run({ command: 'command_b' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Possible matches: command_a'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Unknown command: command_b'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });
});
