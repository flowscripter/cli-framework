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

    public readonly helpSubCommand: HelpSubCommand;

    public readonly usageCommand: UsageCommand;

    public readonly versionCommand: VersionCommand;

    /**
     * @param name a string provided to the [[HelpCommand]] and [[UsageCommand]] implementations
     * @param description a string provided to the [[HelpCommand]] and [[UsageCommand]] implementations
     * @param version a string provided to the [[VersionCommand]] implementation
     */
    public constructor(name: string, description: string, version: string) {
        this.helpGlobalCommand = new HelpGlobalCommand(name, description, version);
        this.helpSubCommand = new HelpSubCommand(name, description, version);
        this.usageCommand = new UsageCommand(name, description, this.helpGlobalCommand);
        this.versionCommand = new VersionCommand(version);
    }

    /**
     * @inheritdoc
     */
    public getCommands(): Iterable<Command> {
        return [
            this.versionCommand,
            this.helpSubCommand,
            this.helpGlobalCommand,
            this.usageCommand,
            new LogLevelCommand(100),
            new ConfigCommand(90),
            new NoColorCommand(80),
            new ColorCommand(70)
        ];
    }
}
