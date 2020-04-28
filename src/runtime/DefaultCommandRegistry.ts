/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable max-len */

import _ from 'lodash';
import CommandRegistry from '../api/CommandRegistry';
import Command from '../api/Command';
import GlobalCommand from '../api/GlobalCommand';
import GlobalModifierCommand from '../api/GlobalModifierCommand';
import GroupCommand from '../api/GroupCommand';
import SubCommand from '../api/SubCommand';
import {
    isSubCommand,
    isGlobalCommand,
    isGlobalModifierCommand,
    isGroupCommand
} from '../api/CommandTypeGuards';
import validateCommand from './CommandValidation';

/**
 * Default implementation of a [[CommandRegistry]].
 */
export default class DefaultCommandRegistry implements CommandRegistry {

    private readonly subCommandsByName: Map<string, SubCommand> = new Map();

    private readonly globalOrGlobalModifierCommandsByName: Map<string, GlobalCommand | GlobalModifierCommand> = new Map();

    private readonly globalOrGlobalModifierCommandsByShortAlias: Map<string, GlobalCommand | GlobalModifierCommand> = new Map();

    private readonly commands = new Array<Command>();

    private readonly globalCommands = new Array<GlobalCommand>();

    private readonly globalModifierCommands = new Array<GlobalModifierCommand>();

    private readonly subCommands = new Array<SubCommand>();

    private readonly groupCommands = new Array<GroupCommand>();

    private nonGlobalCommandsByName: Map<string, Command> = new Map();

    /**
     * Validate specified command against all others validated so far.
     *
     * @throws *Error* if the [[Command]] is not a [[GlobalCommand]] and its name duplicates an already validated
     * [[Command]] name.
     */
    private validateWithOtherCommands(command: Command): void {

        // check for non-global command name duplicate
        if (!isGlobalCommand(command)) {
            if (this.nonGlobalCommandsByName.has(command.name)) {
                throw new Error(`Command name: ${command.name} duplicates the name of an existing command`);
            }
        }

        // store command by name for future validation against new commands
        this.nonGlobalCommandsByName.set(command.name, command);
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if:
     *
     * * the provided [[Command]] instances are not valid
     */
    public addCommand(command: Command): void {

        validateCommand(command);
        this.validateWithOtherCommands(command);

        this.commands.push(command);

        if (isSubCommand(command)) {
            this.subCommands.push(command);
            this.subCommandsByName.set(command.name, command);
            return;
        }

        if (isGlobalCommand(command)) {
            this.globalCommands.push(command);
            this.globalOrGlobalModifierCommandsByName.set(command.name, command);
            if (!_.isUndefined(command.shortAlias)) {
                this.globalOrGlobalModifierCommandsByShortAlias.set(command.shortAlias, command);
            }
            return;
        }

        if (isGlobalModifierCommand(command)) {
            this.globalModifierCommands.push(command);
            this.globalOrGlobalModifierCommandsByName.set(command.name, command);
            if (!_.isUndefined(command.shortAlias)) {
                this.globalOrGlobalModifierCommandsByShortAlias.set(command.shortAlias, command);
            }
            return;
        }

        // group commands
        if (isGroupCommand(command)) {
            this.groupCommands.push(command);
            return;
        }

        throw new Error('Unsupported command type provided');
    }


    /**
     * @inheritdoc
     */
    public getCommands(): Iterable<Command> {
        return this.commands;
    }

    /**
     * @inheritdoc
     */
    public getGlobalCommands(): Iterable<GlobalCommand> {
        return this.globalCommands;
    }

    /**
     * @inheritdoc
     */
    public getGlobalModifierCommands(): Iterable<GlobalModifierCommand> {
        return this.globalModifierCommands;
    }

    /**
     * @inheritdoc
     */
    public getGroupCommands(): Iterable<GroupCommand> {
        return this.groupCommands;
    }

    /**
     * @inheritdoc
     */
    public getSubCommands(): Iterable<SubCommand> {
        return this.subCommands;
    }

    /**
     * @inheritdoc
     */
    public getSubCommandByName(name: string): SubCommand | undefined {
        return this.subCommandsByName.get(name);
    }

    /**
     * @inheritdoc
     */
    public getGlobalOrGlobalModifierCommandByName(name: string): GlobalCommand | GlobalModifierCommand | undefined {
        return this.globalOrGlobalModifierCommandsByName.get(name);
    }

    /**
     * @inheritdoc
     */
    public getGlobalOrGlobalModifierCommandByShortAlias(name: string): GlobalCommand | GlobalModifierCommand | undefined {
        return this.globalOrGlobalModifierCommandsByShortAlias.get(name);
    }
}
