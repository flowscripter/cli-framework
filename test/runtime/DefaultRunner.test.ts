import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import DefaultRunner from '../../src/runtime/DefaultRunner';
import Option from '../../src/api/Option';
import Positional from '../../src/api/Positional';
import DefaultParser from '../../src/runtime/parser/DefaultParser';
import SubCommand from '../../src/api/SubCommand';
import GlobalCommand from '../../src/api/GlobalCommand';
import GlobalCommandArgument from '../../src/api/GlobalCommandArgument';
import GlobalModifierCommand from '../../src/api/GlobalModifierCommand';
import GroupCommand from '../../src/api/GroupCommand';
import { getContext } from '../fixtures/Context';
import { StderrPrinterService } from '../../src/core/service/PrinterService';
import { RunResult } from '../../src';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

function getSubCommand<S_ID>(name: string, options: Option[], positionals: Positional[]): SubCommand {
    return {
        name,
        options,
        positionals,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalCommand<S_ID>(name: string, shortAlias: string, argument?: GlobalCommandArgument): GlobalCommand {
    return {
        name,
        shortAlias,
        argument,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalModifierCommand<S_ID>(name: string, shortAlias: string, runPriority: number,
    argument?: GlobalCommandArgument): GlobalModifierCommand {
    return {
        name,
        shortAlias,
        runPriority,
        argument,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGroupCommand<S_ID>(name: string, memberSubCommands: SubCommand[]): GroupCommand {
    return {
        name,
        memberSubCommands,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

describe('DefaultRunner test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('DefaultRunner is instantiable', () => {
        expect(new DefaultRunner(new DefaultParser())).toBeInstanceOf(DefaultRunner);
    });

    test('Check valid default command type', async () => {
        const stderrService = new StderrPrinterService(90);
        const subCommand = getSubCommand('command', [], []);
        const context = getContext({}, [stderrService], [subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command'], context,
            getGlobalModifierCommand('modifier', 'm', 0))).rejects.toThrowError();
        await expect(runner.run(['command'], context,
            getGroupCommand('group', [getSubCommand('sub', [], [])]))).rejects.toThrowError();

        await runner.run(['command'], context, getSubCommand('sub', [], []));
        await runner.run(['command'], context, getGlobalCommand('global', 'g'));
    });

    test('Sub-Command run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let hasRun = false;

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const command = getSubCommand('command', [option], []);

        command.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({}, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['command', '--foo', 'bar'], context);
        expect(hasRun).toBe(true);
    });

    test('Global Modifier run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let subHasRun = false;

        const globalModifierCommand = getGlobalModifierCommand('modifierCommand', 'c', 1, {
            name: 'value'
        });
        const subCommand = getSubCommand('subCommand', [], []);

        globalModifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        subCommand.run = async (): Promise<void> => { subHasRun = true; };

        const context = getContext({}, [stderrService], [globalModifierCommand, subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifierCommand=bar', 'subCommand'], context);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        modifierHasRun = false;
        subHasRun = false;

        await runner.run(['-c', 'bar', 'subCommand'], context);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global Command run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let hasRun = false;

        const command = getGlobalCommand('command', 'c', {
            name: 'value'
        });

        command.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({}, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--command=bar'], context);

        expect(hasRun).toBe(true);

        hasRun = false;

        await runner.run(['-c', 'bar'], context);
        expect(hasRun).toBe(true);
    });

    test('Group Command run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let subHasRun = false;
        let groupHasRun = false;

        const subCommand = getSubCommand('command', [], []);
        const command = getGroupCommand('group', [subCommand]);

        subCommand.run = async (): Promise<void> => { subHasRun = true; };
        command.run = async (): Promise<void> => { groupHasRun = true; };

        const context = getContext({}, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['group', 'command'], context);

        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        await runner.run(['group:command'], context);

        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global qualifier and non-global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let subHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        subCommand.run = async (): Promise<void> => { subHasRun = true; };

        const context = getContext({}, [stderrService], [modifierCommand, subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar', 'command', '--foo', 'bar'], context);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global qualifier and global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let globalHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        globalCommand.run = async (): Promise<void> => { globalHasRun = true; };

        const context = getContext({}, [stderrService], [modifierCommand, globalCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar', '-g', 'bar'], context);

        expect(modifierHasRun).toBe(true);
        expect(globalHasRun).toBe(true);
    });

    test('Global qualifier and default run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let defaultHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g');

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        globalCommand.run = async (): Promise<void> => { defaultHasRun = true; };

        const context = getContext({}, [stderrService], [modifierCommand, globalCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar'], context, globalCommand);

        expect(modifierHasRun).toBe(true);
        expect(defaultHasRun).toBe(true);
    });

    test('Default run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let subHasRun = false;

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { subHasRun = true; };

        const context = getContext({}, [stderrService], []);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--foo=bar'], context, subCommand);

        expect(subHasRun).toBe(true);
    });

    test('Error thrown in non-global run scenario', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { throw new Error(); };

        const context = getContext({}, [], [subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command', '--foo', 'bar'], context)).toBeDefined();
    });

    test('Error thrown in global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        globalCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };

        const context = getContext({ stderr: process.stderr }, [stderrService], [globalCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--global=bar'], context);
        expect(runResult).toBe(RunResult.CommandError);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Error running'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('d34db33f'));
    });

    test('Error thrown in global modifier run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let globalHasRun = false;

        const globalModifierCommand = getGlobalModifierCommand('modifier', 'm', 1);
        const globalCommand = getGlobalCommand('global', 'g');

        globalModifierCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };
        globalCommand.run = async (): Promise<void> => { globalHasRun = true; };

        const context = getContext({ stderr: process.stderr }, [stderrService], [globalCommand, globalModifierCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--global', '--modifier'], context);
        expect(runResult).toBe(RunResult.CommandError);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Error running'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('d34db33f'));
        expect(globalHasRun).toBe(false);
    });

    test('Unknown arg warning in non-global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;

        const subCommand = getSubCommand('command', [], []);

        subCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({ stderr: process.stderr }, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['command', '-bad'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: -bad'));
        expect(hasRun).toBe(true);
    });

    test('Unknown arg warning in global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;

        const globalCommand = getGlobalCommand('global', 'g');

        globalCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({ stderr: process.stderr }, [stderrService], []);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--bad'], context, globalCommand);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: --bad'));
        expect(hasRun).toBe(true);
    });

    test('Error thrown default run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        const globalCommand = getGlobalCommand('global', 'g');

        globalCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };

        const context = getContext({ stderr: process.stderr }, [stderrService], []);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run([], context, globalCommand);
        expect(runResult).toBe(RunResult.CommandError);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Error running'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('d34db33f'));
    });

    test('Illegal second command treated as unknown arg', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand1 = getSubCommand('command1', [option], []);
        subCommand1.run = async (): Promise<void> => { hasRun = true; };
        const subCommand2 = getSubCommand('command2', [], []);

        const context = getContext({ stderr: process.stderr }, [stderrService], [subCommand1, subCommand2]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['command1', '--foo', 'bar', 'command2'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: command2'));
        expect(hasRun).toBe(true);
    });

    test('Ensure global modifier and global run priority order', async () => {
        const stderrService = new StderrPrinterService(90);
        const hasRun: string[] = [];

        const modifier1Command = getGlobalModifierCommand('modifier1', '1', 2, {
            name: 'value'
        });
        const modifier2Command = getGlobalModifierCommand('modifier2', '2', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        modifier1Command.run = async (): Promise<void> => { hasRun.push(modifier1Command.name); };
        modifier2Command.run = async (): Promise<void> => { hasRun.push(modifier2Command.name); };
        globalCommand.run = async (): Promise<void> => { hasRun.push(globalCommand.name); };

        const context = getContext({}, [stderrService], [globalCommand, modifier1Command, modifier2Command]);
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier2=foo', '-g', 'bar', '--modifier1=bar'], context);

        expect(hasRun[0]).toBe('modifier1');
        expect(hasRun[1]).toBe('modifier2');
        expect(hasRun[2]).toBe('global');
    });

    test('Error thrown for unused leading args', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        const context = getContext({}, [], [subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['blah', 'command', '--foo', 'bar'], context)).toBeDefined();
    });

    test('Error thrown for unused trailing args', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        const context = getContext({}, [], [subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command', '--foo', 'bar', 'blah'], context)).toBeDefined();
    });
});
