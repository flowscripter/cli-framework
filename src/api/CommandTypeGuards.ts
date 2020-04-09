/**
 * @module @flowscripter/cli-framework-api
 */

import SubCommand from './SubCommand';
import GroupCommand from './GroupCommand';
import GlobalCommand from './GlobalCommand';
import GlobalModifierCommand from './GlobalModifierCommand';

export function isGroupCommand(command: SubCommand | GroupCommand | GlobalCommand | GlobalModifierCommand):
    command is GroupCommand {
    return (command as GroupCommand).memberSubCommands !== undefined;
}

export function isSubCommand(command: SubCommand | GroupCommand | GlobalCommand | GlobalModifierCommand):
    command is SubCommand {
    return (command as SubCommand).options !== undefined;
}

export function isGlobalModifierCommand(command: SubCommand | GroupCommand | GlobalCommand | GlobalModifierCommand):
    command is GlobalCommand {
    return (command as GlobalModifierCommand).runPriority !== undefined;
}

export function isGlobalCommand(command: SubCommand | GroupCommand | GlobalCommand | GlobalModifierCommand):
    command is GlobalCommand {
    return !isGroupCommand(command) && !isSubCommand(command) && !isGlobalModifierCommand(command);
}
