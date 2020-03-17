import {
    isSubCommand, isGroupCommand, isGlobalCommand, isGlobalModifierCommand
} from '../../src/api/CommandTypeGuards';
import SubCommand from '../../src/api/SubCommand';
import GlobalCommand from '../../src/api/GlobalCommand';
import GroupCommand from '../../src/api/GroupCommand';
import GlobalModifierCommand from '../../src/api/GlobalModifierCommand';

describe('CommandTypeGuards test', () => {

    function getSubCommand(): SubCommand {
        return {
            name: 'command',
            options: [],
            positionals: [],
            run: async (): Promise<void> => {
                // empty
            }
        };
    }

    function getGroupCommand(): GroupCommand {
        return {
            name: 'command',
            memberSubCommands: [getSubCommand()],
            run: async (): Promise<void> => {
                // empty
            }
        };
    }

    function getGlobalCommand(): GlobalCommand {
        return {
            name: 'command',
            run: async (): Promise<void> => {
                // empty
            }
        };
    }

    function getGlobalModifierCommand(): GlobalModifierCommand {
        return {
            name: 'command',
            runPriority: 1,
            run: async (): Promise<void> => {
                // empty
            }
        };
    }

    test('isSubCommand works', () => {
        expect(isSubCommand(getSubCommand())).toBeTruthy();
        expect(isSubCommand(getGroupCommand())).toBeFalsy();
        expect(isSubCommand(getGlobalCommand())).toBeFalsy();
        expect(isSubCommand(getGlobalModifierCommand())).toBeFalsy();
    });

    test('isGroupCommand works', () => {
        expect(isGroupCommand(getSubCommand())).toBeFalsy();
        expect(isGroupCommand(getGroupCommand())).toBeTruthy();
        expect(isGroupCommand(getGlobalCommand())).toBeFalsy();
        expect(isGroupCommand(getGlobalModifierCommand())).toBeFalsy();
    });

    test('isGlobalCommand works', () => {
        expect(isGlobalCommand(getSubCommand())).toBeFalsy();
        expect(isGlobalCommand(getGroupCommand())).toBeFalsy();
        expect(isGlobalCommand(getGlobalCommand())).toBeTruthy();
        expect(isGlobalCommand(getGlobalModifierCommand())).toBeFalsy();
    });

    test('isGlobalModifierCommand works', () => {
        expect(isGlobalModifierCommand(getSubCommand())).toBeFalsy();
        expect(isGlobalModifierCommand(getGroupCommand())).toBeFalsy();
        expect(isGlobalModifierCommand(getGlobalCommand())).toBeFalsy();
        expect(isGlobalModifierCommand(getGlobalModifierCommand())).toBeTruthy();
    });
});
