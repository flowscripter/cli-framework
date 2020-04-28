/**
 * @module @flowscripter/cli-framework
 */

import CommandFactory from '../api/CommandFactory';
import Command from '../api/Command';
import VersionCommand from './command/VersionCommand';
import { ColorCommand, NoColorCommand } from './command/ColorCommand';
import UsageCommand from './command/UsageCommand';
import { HelpGlobalCommand, HelpSubCommand } from './command/HelpCommand';
import LogLevelCommand from './command/LogLevelCommand';
import ConfigCommand from './command/ConfigCommand';

/**
 * Provides core commands.
 */
export default class CoreCommandFactory implements CommandFactory {

    public readonly helpGlobalCommand: HelpGlobalCommand;

    public readonly usageCommand: UsageCommand;

    public constructor() {
        this.helpGlobalCommand = new HelpGlobalCommand();
        this.usageCommand = new UsageCommand(this.helpGlobalCommand);
    }

    /**
     * @inheritdoc
     */
    public getCommands(): Iterable<Command> {
        return [
            new VersionCommand(),
            new HelpSubCommand(),
            this.helpGlobalCommand,
            this.usageCommand,
            new LogLevelCommand(100),
            new ConfigCommand(90),
            new NoColorCommand(80),
            new ColorCommand(70)
        ];
    }
}
