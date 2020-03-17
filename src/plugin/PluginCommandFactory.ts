/**
 * @module @flowscripter/cli-framework
 */

import CommandFactory from '../api/CommandFactory';
import Command from '../api/Command';
import InstallCommand from './command/InstallCommand';

/**
 * Provides plugin commands.
 */
export default class PluginCommandFactory implements CommandFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [
            new InstallCommand()
        ];
    }
}
