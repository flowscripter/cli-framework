/**
 * @module @flowscripter/cli-framework
 */

import CommandFactory from '../api/CommandFactory';
import Command from '../api/Command';
import PluginCommand from './command/PluginCommand';

/**
 * Provides a [[Plugin]] [[GroupCommand]] to manage plugins.
 */
export default class PluginCommandFactory implements CommandFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [
            new PluginCommand()
        ];
    }
}
