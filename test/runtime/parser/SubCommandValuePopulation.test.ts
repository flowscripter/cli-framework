import populateSubCommandValues from '../../../src/runtime/parser/SubCommandValuePopulation';
import { InvalidArg, InvalidReason } from '../../../src/api/Parser';
import { CommandArgs } from '../../../src/api/Command';
import { ArgumentValueTypeName } from '../../../src/api/ArgumentValueType';
import { PopulateResult } from '../../../src/runtime/parser/PopulateResult';

function expectExtractResult(result: PopulateResult, commandArgs: CommandArgs, unusedArgs: string[]) {

    expect(result.commandArgs).toEqual(commandArgs);
    expect(result.unusedArgs).toEqual(unusedArgs);
}

describe('SubCommandValuePopulation test', () => {

    test('Option argument', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                shortAlias: 'f'
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['-f', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['-f=bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Option types', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                shortAlias: 'f',
                type: ArgumentValueTypeName.Number
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', '1'], invalidArgs);
        expectExtractResult(result, { foo: '1' }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.String;
        result = populateSubCommandValues(command, ['-f', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['-f'], invalidArgs);
        expectExtractResult(result, { foo: 'true' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Option array', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                shortAlias: 'f',
                isArray: true
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo', 'bar', '--foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=bar', '--foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=bar', '-f', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=bar', '-f=bar'], invalidArgs);
        expectExtractResult(result, { foo: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Two options', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                type: ArgumentValueTypeName.String,
                isArray: false
            }, {
                name: 'goo',
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar', '--goo=gar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar', goo: 'gar' }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['--foo', '--goo=gar'], invalidArgs);
        expectExtractResult(result, { foo: 'true', goo: 'gar' }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].isArray = true;
        result = populateSubCommandValues(command, ['--foo', '--foo', 'false', '--goo=gar'], invalidArgs);
        expectExtractResult(result, { foo: ['true', 'false'], goo: 'gar' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Interleaved option arrays', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                isArray: true
            }, {
                name: 'goo',
                type: ArgumentValueTypeName.Boolean,
                isArray: true,
                shortAlias: 'g',
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar1', '--goo=true', '--foo', 'bar2',
            '--goo=false'], invalidArgs);
        expectExtractResult(result, { foo: ['bar1', 'bar2'], goo: ['true', 'false'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo', 'bar1', '--goo=true', '--goo=false',
            '--foo', 'bar2'], invalidArgs);
        expectExtractResult(result, { foo: ['bar1', 'bar2'], goo: ['true', 'false'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo', 'bar1', '-g', '--foo', 'bar2', '-g=false'],
            invalidArgs);
        expectExtractResult(result, { foo: ['bar1', 'bar2'], goo: ['true', 'false'] }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Unknown option name', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo'
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--goo=moo'], invalidArgs);
        expectExtractResult(result, {}, ['--goo=moo']);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--goo', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['--goo', 'moo']);
        expect(invalidArgs).toEqual([]);
    });

    test('Illegal option syntax', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                shortAlias: 'f',
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        let invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['-foo=moo'], invalidArgs);
        expectExtractResult(result, {}, ['-foo=moo']);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--f', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['--f', 'moo']);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['moo']);
        expect(invalidArgs).toEqual([
            {
                name: 'foo',
                reason: InvalidReason.MissingValue
            }
        ]);

        invalidArgs = [];
        result = populateSubCommandValues(command, ['-f=', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['moo']);
        expect(invalidArgs).toEqual([
            {
                name: 'foo',
                reason: InvalidReason.MissingValue
            }
        ]);
    });

    test('Positional argument', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        command.positionals.push({
            name: 'bar'
        });

        result = populateSubCommandValues(command, ['foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'foo', bar: 'bar' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Positional types', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo',
                type: ArgumentValueTypeName.Number
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['1'], invalidArgs);
        expectExtractResult(result, { foo: '1' }, []);
        expect(invalidArgs).toEqual([]);

        command.positionals[0].type = ArgumentValueTypeName.String;
        result = populateSubCommandValues(command, ['bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        command.positionals[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['true'], invalidArgs);
        expectExtractResult(result, { foo: 'true' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Multiple positionals', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo1'
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateSubCommandValues(command, ['f1', 'f2'], invalidArgs);
        expectExtractResult(result, { foo1: 'f1', foo2: 'f2' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Positional varargs', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo',
                isVarArgMultiple: true,
                isVarArgOptional: true
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['bar', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['bar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, [], invalidArgs);
        expectExtractResult(result, { }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Multiple positional and varargs', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo'
            }, {
                name: 'bar',
                isVarArgMultiple: true,
                isVarArgOptional: true
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['foo'], invalidArgs);
        expectExtractResult(result, { foo: 'foo' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['foo', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'foo', bar: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['foo', 'bar', 'bar'], invalidArgs);
        expectExtractResult(result, { foo: 'foo', bar: ['bar', 'bar'] }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['foo'], invalidArgs);
        expectExtractResult(result, { foo: 'foo' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('String options either side of positionals', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'goo1',
                shortAlias: 'g1'
            }, {
                name: 'goo2',
                shortAlias: 'g2'
            }],
            positionals: [{
                name: 'foo1'
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--goo1=g1', 'f1', 'f2', '--goo2=g2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--goo1', 'g1', 'f1', 'f2', '--goo2', 'g2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['-g1', 'g1', 'f1', 'f2', '-g2', 'g2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Boolean options either side of positionals', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'goo1',
                shortAlias: 'g1',
                type: ArgumentValueTypeName.Boolean
            }, {
                name: 'goo2',
                shortAlias: 'g2',
                type: ArgumentValueTypeName.Boolean
            }],
            positionals: [{
                name: 'foo1'
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--goo1', 'f1', 'f2', '--goo2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'true', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--goo1', 'true', 'f1', 'f2', '--goo2', 'false'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'false', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['-g1', 'true', 'f1', 'f2', '-g2', 'false'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'false', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Option array either side of positional', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                isArray: true,
                type: ArgumentValueTypeName.String
            }],
            positionals: [{
                name: 'goo'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'f1', 'goo1', '--foo', 'f2'], invalidArgs);
        expectExtractResult(result, {
            foo: ['f1', 'f2'], goo: 'goo1'
        }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['--foo', 'true', 'goo1', '--foo', 'false'], invalidArgs);
        expectExtractResult(result, {
            foo: ['true', 'false'], goo: 'goo1'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo', 'goo1', '--foo'], invalidArgs);
        expectExtractResult(result, {
            foo: ['true', 'true'], goo: 'goo1'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused option after option', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                shortAlias: 'f',
                type: ArgumentValueTypeName.String
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo=bar', '--goo=gar'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, ['--goo=gar']);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['-f', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { foo: 'true' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused option after positional', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo1',
                shortAlias: 'f1',
                type: ArgumentValueTypeName.String
            }],
            positionals: [{
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateSubCommandValues(command, ['--foo1', 'bar', 'foo2', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { foo1: 'bar', foo2: 'foo2' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused positional after positional', () => {

        const command = {
            name: 'command',
            options: [],
            positionals: [{
                name: 'foo',
                type: ArgumentValueTypeName.String
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateSubCommandValues(command, ['bar', 'goo'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, ['goo']);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused positional after optional', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                type: ArgumentValueTypeName.String
            }],
            positionals: [],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['--foo', 'bar', 'goo'], invalidArgs);
        expectExtractResult(result, { foo: 'bar' }, ['goo']);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['--foo', 'goo'], invalidArgs);
        expectExtractResult(result, { foo: 'true' }, ['goo']);
        expect(invalidArgs).toEqual([]);
    });

    test('Positionals either side of options', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'goo1',
                type: ArgumentValueTypeName.String
            }, {
                name: 'goo2'
            }],
            positionals: [{
                name: 'foo1',
                type: ArgumentValueTypeName.String
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['f1', '--goo1', 'g1', '--goo2', 'g2', 'f2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        command.options[0].type = ArgumentValueTypeName.Boolean;
        command.positionals[0].type = ArgumentValueTypeName.Boolean;
        result = populateSubCommandValues(command, ['true', '--goo1', '--goo2', 'g2', 'f2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'g2', foo1: 'true', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Positionals and non-boolean options interleaved', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'goo1'
            }, {
                name: 'goo2'
            }],
            positionals: [{
                name: 'foo1'
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['f1', '--goo1', 'g1', 'f2', '--goo2', 'g2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--goo1', 'g1', 'f1', '--goo2', 'g2', 'f2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'g1', goo2: 'g2', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Positionals and boolean options interleaved', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'goo1',
                type: ArgumentValueTypeName.Boolean
            }, {
                name: 'goo2',
                type: ArgumentValueTypeName.Boolean
            }],
            positionals: [{
                name: 'foo1'
            }, {
                name: 'foo2'
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['f1', '--goo1', 'true', 'f2', '--goo2', 'true'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'true', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['f1', '--goo1', 'f2', '--goo2'], invalidArgs);
        expectExtractResult(result, {
            goo1: 'true', goo2: 'true', foo1: 'f1', foo2: 'f2'
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Array option before vararg positional', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                type: ArgumentValueTypeName.String,
                isArray: true
            }],
            positionals: [{
                name: 'goo',
                isVarArgMultiple: true
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateSubCommandValues(command, ['--foo', 'f1', '--foo', 'f2', 'g1', 'g2'], invalidArgs);
        expectExtractResult(result, {
            foo: ['f1', 'f2'], goo: ['g1', 'g2']
        }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Vararg positional before array option', () => {

        const command = {
            name: 'command',
            options: [{
                name: 'foo',
                type: ArgumentValueTypeName.String,
                isArray: true
            }],
            positionals: [{
                name: 'goo',
                isVarArgMultiple: true,
                isVarArgOptional: true
            }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateSubCommandValues(command, ['g1', 'g2', '--foo', 'f1', '--foo', 'f2'], invalidArgs);
        expectExtractResult(result, {
            foo: ['f1', 'f2'], goo: ['g1', 'g2']
        }, []);
        expect(invalidArgs).toEqual([]);

        result = populateSubCommandValues(command, ['--foo', 'f1', '--foo', 'f2'], invalidArgs);
        expectExtractResult(result, {
            foo: ['f1', 'f2']
        }, []);
        expect(invalidArgs).toEqual([]);
    });
});
