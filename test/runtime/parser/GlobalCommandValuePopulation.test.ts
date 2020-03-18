import populateGlobalCommandValue from '../../../src/runtime/parser/GlobalCommandValuePopulation';
import { InvalidArg, InvalidReason } from '../../../src/api/Parser';
import { CommandArgs } from '../../../src/api/Command';
import { ArgumentValueTypeName } from '../../../src/api/ArgumentValueType';
import { PopulateResult } from '../../../src/runtime/parser/PopulateResult';

function expectExtractResult(result: PopulateResult, commandArgs: CommandArgs, unusedArgs: string[]) {

    expect(result.commandArgs).toEqual(commandArgs);
    expect(result.unusedArgs).toEqual(unusedArgs);
}

describe('GlobalCommandValuePopulation test', () => {

    test('Global command argument', () => {

        const command = {
            name: 'foo',
            shortAlias: 'f',
            isGlobalModifier: false,
            argument: {
                name: 'value'
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['--foo', 'bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['--foo=bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['-f', 'bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['-f=bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Global command argument types', () => {

        const command = {
            name: 'foo',
            shortAlias: 'f',
            isGlobalModifier: false,
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.Number
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['--foo', '1'], invalidArgs);
        expectExtractResult(result, { value: '1' }, []);
        expect(invalidArgs).toEqual([]);

        command.argument.type = ArgumentValueTypeName.String;
        result = populateGlobalCommandValue(command, ['-f', 'bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        command.argument.type = ArgumentValueTypeName.Boolean;
        result = populateGlobalCommandValue(command, ['-f'], invalidArgs);
        expectExtractResult(result, { value: 'true' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Illegal global command argument syntax', () => {

        const command = {
            name: 'foo',
            shortAlias: 'f',
            isGlobalModifier: false,
            argument: {
                name: 'value'
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        let invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['-foo=moo'], invalidArgs);
        expectExtractResult(result, {}, ['-foo=moo']);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['--f', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['--f', 'moo']);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['--foo=', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['moo']);
        expect(invalidArgs).toEqual([
            {
                name: 'foo',
                reason: InvalidReason.MissingValue
            }
        ]);

        invalidArgs = [];
        result = populateGlobalCommandValue(command, ['-f=', 'moo'], invalidArgs);
        expectExtractResult(result, { }, ['moo']);
        expect(invalidArgs).toEqual([
            {
                name: 'foo',
                reason: InvalidReason.MissingValue
            }
        ]);
    });

    test('Unused option after global command argument', () => {

        const command = {
            name: 'foo',
            isGlobalModifier: false,
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.String
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['--foo', 'bar', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);

        command.argument.type = ArgumentValueTypeName.Boolean;
        result = populateGlobalCommandValue(command, ['--foo', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { value: 'true' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused positional after global command argument', () => {

        const command = {
            name: 'foo',
            isGlobalModifier: false,
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.String
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['--foo', 'bar', 'goo'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, ['goo']);
        expect(invalidArgs).toEqual([]);

        command.argument.type = ArgumentValueTypeName.Boolean;
        result = populateGlobalCommandValue(command, ['--foo', 'goo'], invalidArgs);
        expectExtractResult(result, { value: 'true' }, ['goo']);
        expect(invalidArgs).toEqual([]);
    });
});
