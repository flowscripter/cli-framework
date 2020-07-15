/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import Command from '../api/Command';
import Context from '../api/Context';

export const COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID = 'command_factory_plugin_extension_point';

const log: debug.Debugger = debug('ServiceFactory');

export async function handleLoadedCommandFactory(commandFactory: CommandFactory, context: Context): Promise<void> {
    for (const command of commandFactory.getCommands()) {
        if (context.commandRegistry.getGlobalOrGlobalModifierCommandByName(command.name)
            || context.commandRegistry.getSubCommandByName(command.name)
            || context.commandRegistry.getGroupCommandByName(command.name)) {
            log(`Skipping command with duplicate name ${command.name}`);
        } else {
            context.commandRegistry.addCommand(command);
        }
    }
}

/**
 * Extension interface used by a [[CLI]] to load [[Command]] implementations from an
 * esm-dynamic-plugins plugin implementation.
 */
export default interface CommandFactory {

    /**
     * Return all [[Command]] instances supplied by this factory.
     *
     * @return iterable of [[Command]] instances
     */
    getCommands(): Iterable<Command>;
}
