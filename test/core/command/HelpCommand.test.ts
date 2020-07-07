// eslint-disable-next-line max-classes-per-file
import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import { HelpGlobalCommand, HelpSubCommand } from '../../../src/core/command/HelpCommand';
import { StdoutPrinterService, StderrPrinterService } from '../../../src/core/service/PrinterService';
import SubCommandA from '../../fixtures/SubCommandA';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import SubCommand from '../../../src/api/SubCommand';
import { CommandArgs } from '../../../src/api/Command';
import Context from '../../../src/api/Context';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

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
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help, commandA]);
        stdoutService.init(context);
        stderrService.init(context);

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
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help, commandA]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.description));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(commandA.options[0].name));
    });

    test('HelpGlobalCommand with unknown command specified error warning and generic help', async () => {
        const help = new HelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpSubCommand with unknown command specified displays error and generic help', async () => {
        const help = new HelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'hello' }, context);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unknown command: hello'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('HelpSubCommand with mistyped command specified proposes matches', async () => {
        const help = new HelpSubCommand();
        const commandA = new SubCommandA();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [
            new OtherCommand1(), help, commandA, new OtherCommand2()]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'command_b' }, context);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Possible matches: command_a'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unknown command: command_b'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });
});
