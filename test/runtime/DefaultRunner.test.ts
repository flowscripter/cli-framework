import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import DefaultRunner from '../../src/runtime/DefaultRunner';
import Option from '../../src/api/Option';
import Positional from '../../src/api/Positional';
import DefaultContext from '../../src/runtime/DefaultContext';
import DefaultParser from '../../src/runtime/parser/DefaultParser';
import SubCommand from '../../src/api/SubCommand';
import GlobalCommand from '../../src/api/GlobalCommand';
import GlobalCommandArgument from '../../src/api/GlobalCommandArgument';
import GlobalModifierCommand from '../../src/api/GlobalModifierCommand';
import GroupCommand from '../../src/api/GroupCommand';

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
        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const subCommand = getSubCommand('command', [], []);
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command'], context, [subCommand],
            getGlobalModifierCommand('modifier', 'm', 0))).rejects.toThrowError();
        await expect(runner.run(['command'], context, [subCommand],
            getGroupCommand('group', [getSubCommand('sub', [], [])]))).rejects.toThrowError();

        await runner.run(['command'], context, [subCommand], getSubCommand('sub', [], []));
        await runner.run(['command'], context, [subCommand], getGlobalCommand('global', 'g'));
    });

    test('Check for duplicate command name', async () => {

        const runner = new DefaultRunner(new DefaultParser());
        const command1 = getSubCommand('c1', [], []);
        const command2 = getSubCommand('c1', [], []);

        let context = new DefaultContext({}, [], [], new Map(), new Map());
        await runner.run(['c1'], context, [command1]);

        context = new DefaultContext({}, [], [], new Map(), new Map());
        await expect(runner.run(['c1'], context, [command1, command2])).rejects.toThrowError();
    });

    test('Sub-Command run scenario', async () => {

        let hasRun = false;

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const command = getSubCommand('command', [option], []);

        command.run = async (): Promise<void> => { hasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['command', '--foo', 'bar'], context, [command]);
        expect(hasRun).toBe(true);
    });

    test('Global Modifier run scenario', async () => {

        let modifierHasRun = false;
        let subHasRun = false;

        const globalModifierCommand = getGlobalModifierCommand('modifierCommand', 'c', 1, {
            name: 'value'
        });
        const subCommand = getSubCommand('subCommand', [], []);

        globalModifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        subCommand.run = async (): Promise<void> => { subHasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifierCommand=bar', 'subCommand'], context, [globalModifierCommand, subCommand]);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        modifierHasRun = false;
        subHasRun = false;

        await runner.run(['-c', 'bar', 'subCommand'], context, [globalModifierCommand, subCommand]);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global Command run scenario', async () => {

        let hasRun = false;

        const command = getGlobalCommand('command', 'c', {
            name: 'value'
        });

        command.run = async (): Promise<void> => { hasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--command=bar'], context, [command]);

        expect(hasRun).toBe(true);

        hasRun = false;

        await runner.run(['-c', 'bar'], context, [command]);
        expect(hasRun).toBe(true);
    });

    test('Group Command run scenario', async () => {

        let subHasRun = false;
        let groupHasRun = false;

        const subCommand = getSubCommand('command', [], []);
        const command = getGroupCommand('group', [subCommand]);

        subCommand.run = async (): Promise<void> => { subHasRun = true; };
        command.run = async (): Promise<void> => { groupHasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['group', 'command'], context, [command]);

        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);

        await runner.run(['group:command'], context, [command]);

        expect(groupHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global qualifier and non-global run scenario', async () => {

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

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar', 'command', '--foo', 'bar'], context, [modifierCommand, subCommand]);

        expect(modifierHasRun).toBe(true);
        expect(subHasRun).toBe(true);
    });

    test('Global qualifier and global run scenario', async () => {

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

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar', '-g', 'bar'], context, [modifierCommand, globalCommand]);

        expect(modifierHasRun).toBe(true);
        expect(globalHasRun).toBe(true);
    });

    test('Global qualifier and default run scenario', async () => {

        let modifierHasRun = false;
        let defaultHasRun = false;

        const modifierCommand = getGlobalModifierCommand('modifier', 'm', 1, {
            name: 'value'
        });
        const globalCommand = getGlobalCommand('global', 'g');

        modifierCommand.run = async (): Promise<void> => { modifierHasRun = true; };
        globalCommand.run = async (): Promise<void> => { defaultHasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier=bar'], context, [modifierCommand, globalCommand], globalCommand);

        expect(modifierHasRun).toBe(true);
        expect(defaultHasRun).toBe(true);
    });

    test('Default run scenario', async () => {

        let subHasRun = false;

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { subHasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--foo=bar'], context, [], subCommand);

        expect(subHasRun).toBe(true);
    });

    test('Error thrown in non-global run scenario', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        subCommand.run = async (): Promise<void> => { throw new Error(); };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command', '--foo', 'bar'], context, [subCommand])).toBeDefined();
    });

    test('Error thrown in global run scenario', async () => {

        const globalCommand = getGlobalCommand('global', 'g', {
            name: 'value'
        });

        globalCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run(['--global=bar'], context, [globalCommand]);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('d34db33f')).toBeTruthy();
        }
    });

    test('Error thrown in global modifier run scenario', async () => {

        let globalHasRun = false;

        const globalModifierCommand = getGlobalModifierCommand('modifier', 'm', 1);
        const globalCommand = getGlobalCommand('global', 'g');

        globalModifierCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };
        globalCommand.run = async (): Promise<void> => { globalHasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run(['--global', '--modifier'], context, [globalCommand, globalModifierCommand]);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('d34db33f')).toBeTruthy();
        }
        expect(globalHasRun).toBe(false);
    });

    test('Parse error in non-global run scenario', async () => {

        let hasRun = false;

        const subCommand = getSubCommand('command', [], []);

        subCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run(['command', '-bad'], context, [subCommand]);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('Unused arg: -bad')).toBeTruthy();
        }
        expect(hasRun).toBe(false);
    });

    test('Parse error in global run scenario', async () => {

        let hasRun = false;

        const globalCommand = getGlobalCommand('global', 'g');

        globalCommand.run = async (): Promise<void> => { hasRun = true; };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run(['--bad'], context, [], globalCommand);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('Unused arg: --bad')).toBeTruthy();
        }
        expect(hasRun).toBe(false);
    });

    test('Error thrown default run scenario', async () => {

        const globalCommand = getGlobalCommand('global', 'g');

        globalCommand.run = async (): Promise<void> => { throw new Error('d34db33f'); };

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run([], context, [], globalCommand);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('d34db33f')).toBeTruthy();
        }
    });

    test('Illegal multiple commands invoked', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand1 = getSubCommand('command1', [option], []);
        const subCommand2 = getSubCommand('command2', [], []);

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        const error = await runner.run(['command1', '--foo', 'bar', 'command2'], context, [subCommand1, subCommand2]);
        expect(error).toBeDefined();
        if (error) {
            expect(error.includes('Unused arg: command2')).toBeTruthy();
        }
    });

    test('Ensure global modifier and global run priority order', async () => {

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

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await runner.run(['--modifier2=foo', '-g', 'bar', '--modifier1=bar'], context,
            [globalCommand, modifier1Command, modifier2Command]);

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

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['blah', 'command', '--foo', 'bar'], context, [subCommand])).toBeDefined();
    });

    test('Error thrown for unused trailing args', async () => {

        const option = {
            name: 'foo',
            shortAlias: 'f'
        };
        const subCommand = getSubCommand('command', [option], []);

        const context = new DefaultContext({}, [], [], new Map(), new Map());
        const runner = new DefaultRunner(new DefaultParser());

        await expect(runner.run(['command', '--foo', 'bar', 'blah'], context, [subCommand])).toBeDefined();
    });
});
