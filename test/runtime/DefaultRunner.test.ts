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
import { RunResult } from '../../src/api/Runner';
import CLIConfig from '../../src/api/CLIConfig';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

function getSubCommand(name: string, options: Option[], positionals: Positional[]): SubCommand {
    return {
        name,
        options,
        positionals,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalCommand(name: string, shortAlias: string, argument?: GlobalCommandArgument): GlobalCommand {
    return {
        name,
        shortAlias,
        argument,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalModifierCommand(name: string, shortAlias: string, runPriority: number,
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

function getGroupCommand(name: string, memberSubCommands: SubCommand[]): GroupCommand {
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
        const context = getContext({} as CLIConfig, [stderrService], [subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command'], context,
            getGlobalModifierCommand('modifier', 'm', 0))).rejects.toThrowError();
        await expect(runner.run(['command'], context,
            getGroupCommand('group', [getSubCommand('sub', [], [])]))).rejects.toThrowError();

        let runResult = await runner.run(['command'], context, getSubCommand('sub', [], []));
        expect(runResult).toBe(RunResult.Success);
        runResult = await runner.run(['command'], context, getGlobalCommand('global', 'g'));
        expect(runResult).toBe(RunResult.Success);
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

        const context = getContext({} as CLIConfig, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['command', '--foo', 'bar'], context);
        expect(runResult).toBe(RunResult.Success);
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

        const context = getContext({} as CLIConfig, [stderrService], [globalModifierCommand, subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        let runResult = await runner.run(['--modifierCommand=bar', 'subCommand'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        modifierHasRun = false;
        subHasRun = false;

        runResult = await runner.run(['-c', 'bar', 'subCommand'], context);
        expect(runResult).toBe(RunResult.Success);
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

        const context = getContext({} as CLIConfig, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        let runResult = await runner.run(['--command=bar'], context);
        expect(hasRun).toBe(true);
        expect(runResult).toBe(RunResult.Success);

        hasRun = false;

        runResult = await runner.run(['-c', 'bar'], context);
        expect(runResult).toBe(RunResult.Success);
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

        const context = getContext({} as CLIConfig, [stderrService], [command]);
        const runner = new DefaultRunner(new DefaultParser());

        let runResult = await runner.run(['group', 'command'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        runResult = await runner.run(['group:command'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global modifier and non-global run scenario', async () => {
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

        const context = getContext({} as CLIConfig, [stderrService], [modifierCommand, subCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier=bar', 'command', '--foo', 'bar'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global modifier and global run scenario', async () => {
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

        const context = getContext({} as CLIConfig, [stderrService], [modifierCommand, globalCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier=bar', '-g', 'bar'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(modifierHasRun).toBe(true);
        expect(globalHasRun).toBe(true);
    });

    test('Two global modifier and global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifier1HasRun = false;
        let modifier2HasRun = false;
        let globalHasRun = false;

        const modifierCommand1 = getGlobalModifierCommand('modifier1', 'm', 1, {
            name: 'value'
        });
        const modifierCommand2 = getGlobalModifierCommand('modifier2', 'n', 2, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        modifierCommand1.run = async (): Promise<void> => { modifier1HasRun = true; };
        modifierCommand2.run = async (): Promise<void> => { modifier2HasRun = true; };
        globalCommand.run = async (): Promise<void> => { globalHasRun = true; };

        const context = getContext({} as CLIConfig,
            [stderrService], [modifierCommand1, modifierCommand2, globalCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier1=bar', '-g', 'bar', '--modifier2=bar'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(modifier1HasRun).toBe(true);
        expect(modifier2HasRun).toBe(true);
        expect(globalHasRun).toBe(true);
    });

    test('Global modifier and default run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let defaultHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g');

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        globalCommand.run = async (): Promise<void> => { defaultHasRun = true; };

        const context = getContext({} as CLIConfig, [stderrService], [modifierCommand, globalCommand]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier=bar'], context, globalCommand);
        expect(runResult).toBe(RunResult.Success);
        expect(modifierHasRun).toBe(true);
        expect(defaultHasRun).toBe(true);
    });

    test('Global modifier parse error', async () => {
        const stderrService = new StderrPrinterService(90);
        let modifierHasRun = false;
        let defaultHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g');

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        globalCommand.run = async (): Promise<void> => { defaultHasRun = true; };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig,
            [stderrService], [modifierCommand, globalCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier'], context, globalCommand);
        expect(runResult).toBe(RunResult.ParseError);
        expect(modifierHasRun).toBe(false);
        expect(defaultHasRun).toBe(false);
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

        const context = getContext({} as CLIConfig, [stderrService], []);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--foo=bar'], context, subCommand);
        expect(runResult).toBe(RunResult.Success);
        expect(subHasRun).toBe(true);
    });

    test('Error thrown in non-global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { throw new Error(); };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['command', '--foo', 'bar'], context);
        expect(runResult).toBe(RunResult.CommandError);
    });

    test('Error thrown in global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        globalCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig,
            [stderrService], [globalCommand]);
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

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig,
            [stderrService], [globalCommand, globalModifierCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--global', '--modifier'], context);
        expect(runResult).toBe(RunResult.CommandError);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Error running'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('d34db33f'));
        expect(globalHasRun).toBe(false);
    });

    test('Parse error warning in non-global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['command', '-f'], context);
        expect(runResult).toBe(RunResult.ParseError);
        expect(hasRun).toBe(false);
    });

    test('No command specified scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run([], context);
        expect(runResult).toBe(RunResult.ParseError);
        expect(hasRun).toBe(false);
    });

    test('Unknown arg warning in non-global run scenario', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        let hasRun = false;

        const subCommand = getSubCommand('command', [], []);

        subCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
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

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], []);
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

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], []);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run([], context, globalCommand);
        expect(runResult).toBe(RunResult.CommandError);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Error running'));
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('d34db33f'));
    });

    test('Run default command based on all args', async () => {
        const stderrService = new StderrPrinterService(90);

        const command = getSubCommand('command', [{
            name: 'foo'
        }, {
            name: 'goo'
        }], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], []);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--foo=f', '--goo=g'], context, command);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).not.toHaveBeenCalledWith(expect.stringContaining('Unused'));
    });

    test('Run default command based on config only and treating all args as unused', async () => {
        const stderrService = new StderrPrinterService(90);

        const command = getSubCommand('command', [{
            name: 'foo'
        }, {
            name: 'goo'
        }], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [],
            new Map(), new Map([
                ['command', {
                    foo: 'f',
                    goo: 'g'
                }]
            ]));
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--bip=b', '--bop=b'], context, command);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused'));
    });

    test('Run default command based on some args and treating some args as unused', async () => {
        const stderrService = new StderrPrinterService(90);

        const command = getSubCommand('command', [{
            name: 'foo'
        }, {
            name: 'goo'
        }], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [],
            new Map(), new Map([
                ['command', {
                    foo: 'f'
                }]
            ]));
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--bip=b', '--goo=g'], context, command);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused'));
    });

    test('Fail to parse default command with some unused args', async () => {
        const stderrService = new StderrPrinterService(90);

        const command = getSubCommand('command', [{
            name: 'foo'
        }, {
            name: 'goo'
        }], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], []);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--bip=b', '--goo=g'], context, command);
        expect(runResult).toBe(RunResult.ParseError);
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

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig,
            [stderrService], [subCommand1, subCommand2]);
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

        const context = getContext({} as CLIConfig,
            [stderrService], [globalCommand, modifier1Command, modifier2Command]);
        const runner = new DefaultRunner(new DefaultParser());

        const runResult = await runner.run(['--modifier2=foo', '-g', 'bar', '--modifier1=bar'], context);
        expect(runResult).toBe(RunResult.Success);

        expect(hasRun[0]).toBe('modifier1');
        expect(hasRun[1]).toBe('modifier2');
        expect(hasRun[2]).toBe('global');
    });

    test('Warning for unused leading args', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());
        const runResult = await runner.run(['blah', 'command', '--foo', 'bar'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: blah'));
    });

    test('Warning for unused trailing args', async () => {
        const stderrService = new StderrPrinterService(90);
        stderrService.colorEnabled = false;
        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        const context = getContext({ stderr: process.stderr } as unknown as CLIConfig, [stderrService], [subCommand]);
        stderrService.init(context);
        const runner = new DefaultRunner(new DefaultParser());
        const runResult = await runner.run(['command', '--foo', 'bar', 'blah'], context);
        expect(runResult).toBe(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: blah'));
    });
});
