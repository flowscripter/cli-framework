/**
 * @module @flowscripter/cli-framework
 */

import CommandFactory from '../api/CommandFactory';
import Command from '../api/Command';
import VersionCommand from './command/VersionCommand';

export default class CoreCommandFactory implements CommandFactory {

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [
            new VersionCommand()
        ];
    }
}
