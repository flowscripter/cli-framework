import validateCommand from '../../src/runtime/CommandValidation';
import Positional from '../../src/api/Positional';
import Option from '../../src/api/Option';
import { ArgumentValueTypeName } from '../../src/api/Argument';

function getCommand<S_ID>(isGlobal: boolean, isGlobalQualifier: boolean, options: Option[], positionals: Positional[]) {
    return {
        name: 'command',
        isGlobal,
        isGlobalQualifier,
        options,
        positionals,
        run: async (): Promise<void> => { }
    };
}

describe('CommandValidation test', () => {

    test('Command validation fails', () => {

        // check if there are duplicate argument names

        let command = getCommand(false, false, [{
            name: 'foo'
        }, {
            name: 'foo'
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        command = getCommand(false, false, [{
            name: 'foo'
        }], [{
            name: 'foo'
        }]);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        command = getCommand(false, false, [], [{
            name: 'foo'
        }, {
            name: 'foo'
        }]);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if there are duplicate argument names or option short aliases

        command = getCommand(false, false, [{
            name: 'f'
        }, {
            name: 'foo',
            shortAlias: 'f'
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        command = getCommand(false, false, [{
            name: 'foo1',
            shortAlias: 'f'
        }, {
            name: 'foo2',
            shortAlias: 'f'
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if a global/qualifier command defines option arguments (it should only define positional arguments)

        command = getCommand(true, false, [{
            name: 'foo'
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if the option default value does not match any values specified in argument valid values

        command = getCommand(true, false, [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: ['goo']
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if the type of option defaultValue does not match the type specified in argument type

        command = getCommand(true, false, [{
            name: 'foo',
            defaultValue: 'bar',
            type: ArgumentValueTypeName.Boolean
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if the option defaultValue is an array and option does not support array

        command = getCommand(true, false, [{
            name: 'foo',
            defaultValue: ['bar1', 'bar2']
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();

        // check if the type of values in argument validValues does not match the type specified in argument type

        command = getCommand(true, false, [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: [1]
        }], []);

        expect(() => {
            validateCommand(command);
        }).toThrow();
    });

    test('Command validation succeeds', () => {

        let command = getCommand(false, false, [{
            name: 'foo',
            defaultValue: 'bar',
            validValues: ['bar', 'gar'],
            shortAlias: 'f',
            type: ArgumentValueTypeName.String
        }], [{
            name: 'boo',
            type: ArgumentValueTypeName.Number,
            isVarArg: true,
            validValues: [1, 2]
        }]);

        validateCommand(command);

        command = getCommand(true, false, [], [{
            name: 'boo',
            type: ArgumentValueTypeName.Number,
            isVarArg: true,
            validValues: [1, 2]
        }]);

        validateCommand(command);
    });
});
