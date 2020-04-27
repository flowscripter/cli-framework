import CommandRegistry from '../../src/api/CommandRegistry';
import Command from '../../src/api/Command';
import DefaultCommandRegistry from '../../src/runtime/DefaultCommandRegistry';

// eslint-disable-next-line import/prefer-default-export
export function getCommandRegistry(commands: Command[]): CommandRegistry {

    const commandRegistry = new DefaultCommandRegistry();

    commands.forEach((command) => { commandRegistry.addCommand(command); });

    return commandRegistry;
}
