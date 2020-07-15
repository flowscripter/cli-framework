import Option from '../../src/api/Option';
import Positional from '../../src/api/Positional';
import SubCommand from '../../src/api/SubCommand';
import DefaultCommandRegistry from '../../src/runtime/DefaultCommandRegistry';
import GlobalCommand from '../../src/api/GlobalCommand';
import GroupCommand from '../../src/api/GroupCommand';

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

function getGlobalCommand(name: string): GlobalCommand {
    return {
        name,
        argument: {
            name: 'value'
        },
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGroupCommand(name: string): GroupCommand {
    return {
        name,
        memberSubCommands: [getSubCommand('foo', [], [])],
        run: async (): Promise<void> => {
            // empty
        }
    };
}

describe('DefaultCommandRegistry test', () => {

    test('DefaultCommandRegistry is instantiable', () => {
        expect(new DefaultCommandRegistry()).toBeInstanceOf(DefaultCommandRegistry);
    });

    test('Check for duplicate non-global command name', async () => {
        const command1 = getSubCommand('c1', [], []);
        const command2 = getSubCommand('c1', [], []);
        const commandRegistry = new DefaultCommandRegistry();

        commandRegistry.addCommand(command1);
        expect(() => {
            commandRegistry.addCommand(command2);
        }).toThrow();
    });

    test('Check for duplicate sub-command and group command name', async () => {
        const command1 = getGroupCommand('c1');
        const command2 = getSubCommand('c1', [], []);
        const commandRegistry = new DefaultCommandRegistry();

        commandRegistry.addCommand(command1);
        expect(() => {
            commandRegistry.addCommand(command2);
        }).toThrow();
    });

    test('Check for duplicate global command name', async () => {
        const command1 = getGlobalCommand('c1');
        const command2 = getGlobalCommand('c1');
        const commandRegistry = new DefaultCommandRegistry();

        commandRegistry.addCommand(command1);
        expect(() => {
            commandRegistry.addCommand(command2);
        }).toThrow();
    });

    test('Allow duplicate command name between sub-command and global command', async () => {
        const subCommand = getSubCommand('c1', [], []);
        const globalCommand = getGlobalCommand('c1');
        const commandRegistry = new DefaultCommandRegistry();

        commandRegistry.addCommand(subCommand);
        commandRegistry.addCommand(globalCommand);
    });
});
