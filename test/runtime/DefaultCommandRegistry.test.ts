import Option from '../../src/api/Option';
import Positional from '../../src/api/Positional';
import SubCommand from '../../src/api/SubCommand';
import DefaultCommandRegistry from '../../src/runtime/DefaultCommandRegistry';

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

describe('DefaultCommandRegistry test', () => {

    test('DefaultCommandRegistry is instantiable', () => {
        expect(new DefaultCommandRegistry()).toBeInstanceOf(DefaultCommandRegistry);
    });

    test('Check for duplicate command name', async () => {
        const command1 = getSubCommand('c1', [], []);
        const command2 = getSubCommand('c1', [], []);
        const commandRegistry = new DefaultCommandRegistry();

        commandRegistry.addCommand(command1);
        expect(() => {
            commandRegistry.addCommand(command2);
        }).toThrow();
    });
});
