/* eslint-disable max-classes-per-file,@typescript-eslint/no-non-null-assertion */

import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import {
    MultiCommandHelpGlobalCommand,
    SingleCommandHelpGlobalCommand,
    MultiCommandHelpSubCommand
} from '../../../src/core/command/HelpCommand';
import { StderrPrinterService, StdoutPrinterService } from '../../../src/core/service/PrinterService';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import SubCommand from '../../../src/api/SubCommand';
import GlobalModifierCommand from '../../../src/api/GlobalModifierCommand';
import GlobalCommand from '../../../src/api/GlobalCommand';
import { ArgumentValueTypeName } from '../../../src';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

function getGlobalModifierCommand(name: string, withArg = false, mandatoryArg = false): GlobalModifierCommand {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modifier: any = {
        name,
        runPriority: 1,
        run: async (): Promise<void> => {
            // empty
        }
    };
    if (withArg) {
        modifier.argument = {
            name: 'value'
        };
        if (!mandatoryArg) {
            modifier.argument.isOptional = true;
        }
    }
    return modifier;
}

function getGlobalCommand(name: string, withArg = false, mandatoryArg = false): GlobalCommand {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const global: any = {
        name,
        run: async (): Promise<void> => {
            // empty
        }
    };
    if (withArg) {
        global.argument = {
            name: 'value'
        };
        if (!mandatoryArg) {
            global.argument.isOptional = true;
        }
    }
    return global;
}

function getSubCommand(name: string, withArg = false, mandatoryArg = false, multiple = false,
    type: ArgumentValueTypeName = ArgumentValueTypeName.String,
    defaultValue: string | undefined = undefined): SubCommand {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subCommand: any = {
        name,
        description: 'good',
        options: [],
        positionals: [],
        run: async (): Promise<void> => {
            // empty
        }
    };
    if (withArg) {
        subCommand.options = [{
            name: 'foo',
            type
        }];
        if (!mandatoryArg) {
            subCommand.options[0].isOptional = true;
        }
        if (multiple) {
            subCommand.options[0].isArray = true;
        }
        if (defaultValue) {
            subCommand.options[0].defaultValue = defaultValue;
        }
    }
    return subCommand;
}

describe('HelpCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
    });

    test('MultiCommandHelpGlobalCommand is instantiable', () => {
        expect(new MultiCommandHelpGlobalCommand()).toBeInstanceOf(MultiCommandHelpGlobalCommand);
    });

    test('MultiCommandHelpSubCommand is instantiable', () => {
        expect(new MultiCommandHelpSubCommand()).toBeInstanceOf(MultiCommandHelpSubCommand);
    });

    test('MultiCommandHelpGlobalCommand works', async () => {
        const help = new MultiCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('MultiCommandHelpSubCommand works', async () => {
        const help = new MultiCommandHelpSubCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('MultiCommandHelpGlobalCommand with command specified works', async () => {
        const help = new MultiCommandHelpGlobalCommand();
        const subCommand = getSubCommand('command_a');
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help, subCommand]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(subCommand.description!));
    });

    test('MultiCommandHelpSubCommand with command specified works', async () => {
        const help = new MultiCommandHelpSubCommand();
        const subCommand = getSubCommand('command_a');
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [help, subCommand]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'command_a' }, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Usage'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(subCommand.description!));
    });

    test('MultiCommandHelpGlobalCommand with unknown command specified error warning and generic help', async () => {
        const help = new MultiCommandHelpGlobalCommand();
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

    test('MultiCommandHelpSubCommand with unknown command specified displays error and generic help', async () => {
        const help = new MultiCommandHelpSubCommand();
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

    test('MultiCommandHelpSubCommand with mistyped command specified proposes matches', async () => {
        const help = new MultiCommandHelpSubCommand();
        const commandA = getSubCommand('command_a');
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('other1'), help, commandA, getSubCommand('other2')]);
        stdoutService.init(context);
        stderrService.init(context);

        await help.run({ command: 'command_b' }, context);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Possible matches: command_a'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unknown command: command_b'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo bar'));
        expect(mockStdout).toHaveBeenCalledWith(expect.not.stringContaining('Usage'));
    });

    test('Ensure global options are ordered', async () => {
        const help = new MultiCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stdoutService, stderrService], [
            help,
            getGlobalModifierCommand('zzz', true),
            getGlobalModifierCommand('aaa', true)
        ]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(11, expect.stringMatching(new RegExp('--aaa')));
        expect(mockStdout).toHaveBeenNthCalledWith(13, expect.stringMatching(new RegExp('--zzz')));
    });

    test('Ensure global items are renamed without global if no sub or group commands', async () => {
        const help = new MultiCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        let context = getContext(getCliConfig(), [stdoutService, stderrService], [
            help,
            getGlobalModifierCommand('zzz'),
            getGlobalModifierCommand('aaa')
        ]);
        stdoutService.init(context);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('<option>'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('<command>'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringMatching(new RegExp('^Options')));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringMatching(new RegExp('^Commands')));

        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            help,
            getGlobalModifierCommand('zzz', true),
            getGlobalModifierCommand('aaa', true),
            getSubCommand('command_a')
        ]);

        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('<global_option>'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('<global_command>'));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringMatching(new RegExp('^Global Options')));
        expect(mockStdout).toHaveBeenCalledWith(expect.stringMatching(new RegExp('^Global Commands')));
    });

    test('Ensure multi-command app usage syntax is rendered correctly', async () => {
        const help = new MultiCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        let context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        stdoutService.init(context);

        // dont render global_option if no global modifiers

        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('foobar$')));

        // render global_option arg if global modifiers defined

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1', true),
            getGlobalModifierCommand('modifier2'),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching('[<global_option> [<arg>]]...'));

        // dont render global_option multiplicity if only one defined

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('[<global_option>] <command>'));

        // dont render global_option arg if none defined

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalModifierCommand('modifier2'),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('[<global_option>]... <command>'));

        // dont render global_option arg as optional if none are optional and have no default or not boolean

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1', true, true),
            getGlobalModifierCommand('modifier2', true, true),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('[<global_option> <value>]'));

        // render global_option arg as optional if at least one modifier has no arg

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1', true, true),
            getGlobalModifierCommand('modifier2'),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('[<global_option> [<value>]]'));

        // don't render command if none defined (e.g. default command is configured)

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalModifierCommand('modifier2'),
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('<option>]...$')));

        // render command and global command

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            new MultiCommandHelpGlobalCommand(),
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('<global_command>|<command>'));

        // don't render arg if none defined

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('command_a')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('<command>$')));

        // render arg if at least one defined

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('command_a', true, true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('<command> <arg>'));

        // render arg as optional if at least one is optional

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('command_a', true, true),
            getSubCommand('command_b', true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('<command> \\[<arg> <value>\\]$')));

        // render arg as multiple if at least one multiple

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('command_a', true, true, true),
            getSubCommand('command_b', true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('<command> [<arg> <value>]...'));

        // dont render arg value in [] if none are optional and have no default or not boolean

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getSubCommand('command_a', true, true, true),
            getSubCommand('command_b', true, true, true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringContaining('<command> <<arg> <value>>...'));

        // multiple global and sub commands

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalCommand('global1', true, true),
            getGlobalCommand('global2', true),
            getSubCommand('command_a', true, true),
            getSubCommand('command_b', true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('<global_command>\\|<command> \\[<arg> <value>\\]$')));

        // multiple global and sub commands with multiple args and optional values

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalCommand('global1', true, true),
            getGlobalCommand('global2', true),
            getSubCommand('command_a', true, true, true, ArgumentValueTypeName.Boolean),
            getSubCommand('command_b', true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('<global_command>\\|<command> \\[<arg> \\[<value>\\]\\]...$')));
    });

    test('Ensure single-command app with simple default command help is rendered correctly', async () => {
        const help = new SingleCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        let context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        stdoutService.init(context);

        help.defaultCommand = getSubCommand('command_a', true, true, true);

        // simple default command

        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('--foo'));
    });

    test('Ensure single-command app with default and globals help is rendered correctly', async () => {
        const help = new SingleCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        let context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        stdoutService.init(context);

        help.defaultCommand = getSubCommand('command_a', true, true, true);

        // default and global modifier

        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1', true, true)
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Other Arguments'));

        // default, global modifier and global

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalCommand('global1')
        ]);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('Other Arguments'));
    });

    test('Ensure single-command app usage syntax is rendered correctly', async () => {
        const help = new SingleCommandHelpGlobalCommand();
        const stdoutService = new StdoutPrinterService(100);
        const stderrService = new StderrPrinterService(100);
        stdoutService.colorEnabled = false;
        let context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        stdoutService.init(context);

        // simple default command

        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        help.defaultCommand = getSubCommand('command_a', true, true, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('foobar --foo <value>...$')));

        // simple default command with non-multiple arg

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        help.defaultCommand = getSubCommand('command_a', true, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('foobar --foo <value>$')));

        // simple default command with optional arg

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        help.defaultCommand = getSubCommand('command_a', true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7, expect.stringMatching(new RegExp('foobar \\[--foo <value>\\]$')));

        // with mandatory arg global modifier

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1', true, true)
        ]);
        help.defaultCommand = getSubCommand('command_a', true, true, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('foobar --foo <value>...$')));

        // with global modifier with no arg

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1')
        ]);
        help.defaultCommand = getSubCommand('command_a', true, true, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('foobar --foo <value>...$')));

        // with singular optional arg and global modifier

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1')
        ]);
        help.defaultCommand = getSubCommand('command_a', true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringMatching(new RegExp('foobar \\[--foo <value>\\]$')));

        // with multiple optional arg and multiple global modifiers and multiple global commands

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalModifierCommand('modifier2', true, true),
            getGlobalCommand('global1', true, true),
            getGlobalCommand('global2', true, true)
        ]);
        help.defaultCommand = getSubCommand('command_a', true, false, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('foobar [--foo <value>]...'));

        // with optional arg, multiple global modifiers, multiple global commands, multiple sub-commands

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalModifierCommand('modifier2', true, true),
            getGlobalCommand('global1', true, true),
            getGlobalCommand('global2', true, true),
            getSubCommand('sub1', true, true)
        ]);
        help.defaultCommand = getSubCommand('command_a', true, false, true);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('foobar [--foo <value>]...'));

        // also with boolean args

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], [
            getGlobalModifierCommand('modifier1'),
            getGlobalModifierCommand('modifier2', true, true),
            getGlobalCommand('global1', true, true),
            getGlobalCommand('global2', true, true),
            getSubCommand('sub1', true, true, false, ArgumentValueTypeName.Boolean)
        ]);
        help.defaultCommand = getSubCommand('command_a', true, false, true,
            ArgumentValueTypeName.Boolean);
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('foobar [--foo [<value>]]...'));

        // also with default value

        mockStdout.mockReset();
        context = getContext(getCliConfig(), [stdoutService, stderrService], []);
        help.defaultCommand = getSubCommand('command_a', true, false, true,
            ArgumentValueTypeName.String, 'foo');
        await help.run({}, context);
        expect(mockStdout).toHaveBeenNthCalledWith(7,
            expect.stringContaining('foobar [--foo <value>]...'));
    });
});
