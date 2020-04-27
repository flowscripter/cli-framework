import { ArgumentValueTypeName } from '../../src/api/ArgumentValueType';
import Positional from '../../src/api/Positional';
import Option from '../../src/api/Option';
import GlobalCommandArgument from '../../src/api/GlobalCommandArgument';
import SubCommand from '../../src/api/SubCommand';
import GlobalCommand from '../../src/api/GlobalCommand';
import GroupCommand from '../../src/api/GroupCommand';
import validateCommand, {
    validateGlobalCommand,
    validateSubCommand,
    validateGroupCommand
} from '../../src/runtime/CommandValidation';

function getSubCommand(name: string, options: Option[], positionals: Positional[]): SubCommand {
    return {
        name,
        options,
        positionals,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGroupCommand(name: string, memberSubCommands: ReadonlyArray<SubCommand>):
    GroupCommand {
    return {
        name,
        memberSubCommands,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalCommand(name: string, shortAlias: string, argument?: GlobalCommandArgument): GlobalCommand {
    return {
        name,
        shortAlias,
        argument,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

describe('CommandValidation test', () => {

    test('SubCommand validation fails due to duplicate argument names', () => {

        let command = getSubCommand('command', [{
            name: 'foo'
        }, {
            name: 'foo'
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [{
            name: 'foo'
        }], [{
            name: 'foo'
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [], [{
            name: 'foo'
        }, {
            name: 'foo'
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to duplicate argument names or short aliases', () => {

        let command = getSubCommand('command', [{
            name: 'f'
        }, {
            name: 'foo',
            shortAlias: 'f'
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [{
            name: 'foo1',
            shortAlias: 'f'
        }, {
            name: 'foo2',
            shortAlias: 'f'
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to option default value'
        + ' not matching any values specified in argument valid values', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: ['goo']
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to the type of option defaultValue'
        + ' not matching the type specified in argument type', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            defaultValue: 'bar',
            type: ArgumentValueTypeName.Boolean
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to option defaultValue'
        + ' being an array and option does not support array', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            defaultValue: ['bar1', 'bar2']
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to the type of values in argument'
        + ' validValues not matching the type specified in argument type', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: [1]
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to invalid command name', () => {

        const command = getSubCommand('command', [{
            name: '-foo'
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to invalid command short alias', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            shortAlias: 'foo'
        }], []);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to non-last positional being varargs', () => {

        let command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgMultiple: true
        }, {
            name: 'goo'
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgOptional: true
        }, {
            name: 'goo'
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation fails due to more than one positional being varargs', () => {

        let command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgMultiple: true
        }, {
            name: 'goo',
            isVarArgMultiple: true
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgOptional: true
        }, {
            name: 'goo',
            isVarArgOptional: true
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgOptional: true
        }, {
            name: 'goo',
            isVarArgMultiple: true
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();

        command = getSubCommand('command', [], [{
            name: 'foo',
            isVarArgMultiple: true
        }, {
            name: 'goo',
            isVarArgOptional: true
        }]);

        expect(() => {
            validateSubCommand(command);
        }).toThrow();
    });

    test('SubCommand validation succeeds', () => {

        const command = getSubCommand('command', [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: ['bar', 'gar'],
            shortAlias: 'f',
            type: ArgumentValueTypeName.String
        }], [{
            name: 'boo',
            type: ArgumentValueTypeName.Number,
            isVarArgMultiple: true,
            validValues: [1, 2]
        }]);

        validateSubCommand(command);
        validateCommand(command);
    });

    test('GlobalCommand validation fails due to the default value'
        + ' not matching any values specified in argument valid values', () => {

        const command = getGlobalCommand('command', 'c', {
            name: 'value',
            type: ArgumentValueTypeName.String,
            defaultValue: 'bar',
            validValues: ['goo']
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation fails due to the type of defaultValue'
        + ' not matching the type specified in global argument type', () => {

        const command = getGlobalCommand('command', 'c', {
            name: 'value',
            type: ArgumentValueTypeName.Boolean,
            defaultValue: 'bar'
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation fails due to the type of values in argument'
        + ' validValues not matching the type specified in argument type', () => {

        const command = getGlobalCommand('command', 'c', {
            name: 'value',
            defaultValue: 'bar',
            validValues: [1]
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation fails due to invalid command name', () => {

        const command = getGlobalCommand('-command', 'c', {
            name: 'value'
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation fails due to invalid command short alias', () => {

        const command = getGlobalCommand('command', 'command', {
            name: 'value'
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation fails due to invalid global argument name', () => {

        const command = getGlobalCommand('command', 'command', {
            name: '-'
        });

        expect(() => {
            validateGlobalCommand(command);
        }).toThrow();
    });

    test('GlobalCommand validation succeeds with global argument', () => {

        const command = getGlobalCommand('command', 'c', {
            name: 'value',
            defaultValue: 'bar',
            validValues: ['bar', 'gar'],
            type: ArgumentValueTypeName.String
        });

        validateGlobalCommand(command);
        validateCommand(command);
    });

    test('GlobalCommand validation succeeds without global argument', () => {

        const command = getGlobalCommand('command', 'c');

        validateGlobalCommand(command);
    });

    test('GrouoCommand validation fails due to name and member duplicate names', () => {

        const command = getGroupCommand('command', [
            getSubCommand('command', [], [])
        ]);

        expect(() => {
            validateGroupCommand(command);
        }).toThrow();
    });

    test('GrouoCommand validation fails due to duplicate member command names', () => {

        const command = getGroupCommand('group', [
            getSubCommand('command', [], []),
            getSubCommand('command', [], [])
        ]);

        expect(() => {
            validateGroupCommand(command);
        }).toThrow();
    });

    test('GrouoCommand validation fails due to invalid command name', () => {

        const command = getGroupCommand('-group', [getSubCommand('command', [], [])]);

        expect(() => {
            validateGroupCommand(command);
        }).toThrow();
    });

    test('GrouoCommand validation succeeds', () => {

        const command = getGroupCommand('group', [
            getSubCommand('command1', [], []),
            getSubCommand('command2', [{
                name: 'foo',
                defaultValue: 'bar',
                validValues: ['bar', 'gar'],
                shortAlias: 'f',
                type: ArgumentValueTypeName.String
            }], [{
                name: 'boo',
                type: ArgumentValueTypeName.Number,
                isVarArgMultiple: true,
                validValues: [1, 2]
            }])]);

        validateGroupCommand(command);
        validateCommand(command);
    });
});
