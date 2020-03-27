import populateGlobalCommandValue from '../../../src/runtime/parser/GlobalCommandValuePopulation';
import { InvalidArg, InvalidReason } from '../../../src/api/Parser';
import { CommandArgs } from '../../../src/api/Command';
import { ArgumentValueTypeName } from '../../../src/api/ArgumentValueType';
import { PopulateResult } from '../../../src/runtime/parser/PopulateResult';
import GlobalCommand from '../../../src/api/GlobalCommand';

function expectExtractResult(result: PopulateResult, commandArgs: CommandArgs, unusedArgs: string[]) {

    expect(result.commandArgs).toEqual(commandArgs);
    expect(result.unusedArgs).toEqual(unusedArgs);
}

describe('GlobalCommandValuePopulation test', () => {

    test('Global command argument', () => {

        const command: GlobalCommand = {
            name: 'foo',
            argument: {
                name: 'value'
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateGlobalCommandValue(command, ['bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Global command argument types', () => {

        let command: GlobalCommand = {
            name: 'foo',
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.Number
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, ['1'], invalidArgs);
        expectExtractResult(result, { value: '1' }, []);
        expect(invalidArgs).toEqual([]);

        command = {
            name: 'foo',
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.String
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        result = populateGlobalCommandValue(command, ['bar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, []);
        expect(invalidArgs).toEqual([]);

        command = {
            name: 'foo',
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.Boolean
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        result = populateGlobalCommandValue(command, [], invalidArgs);
        expectExtractResult(result, { value: 'true' }, []);
        expect(invalidArgs).toEqual([]);

        result = populateGlobalCommandValue(command, ['false'], invalidArgs);
        expectExtractResult(result, { value: 'false' }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Missing argument', () => {

        let command: GlobalCommand = {
            name: 'foo',
            argument: {
                name: 'value'
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        let invalidArgs: InvalidArg[] = [];
        let result = populateGlobalCommandValue(command, [], invalidArgs);
        expectExtractResult(result, {}, []);
        expect(invalidArgs).toEqual([
            {
                name: 'value',
                reason: InvalidReason.MissingValue
            }
        ]);

        command = {
            name: 'foo',
            argument: {
                name: 'value',
                isOptional: true
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        invalidArgs = [];
        result = populateGlobalCommandValue(command, [], invalidArgs);
        expectExtractResult(result, { }, []);
        expect(invalidArgs).toEqual([]);

        command = {
            name: 'foo',
            argument: {
                name: 'value',
                defaultValue: 'bar'
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        result = populateGlobalCommandValue(command, [], invalidArgs);
        expectExtractResult(result, { }, []);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused option after global command argument', () => {

        const command: GlobalCommand = {
            name: 'foo',
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.String
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateGlobalCommandValue(command, ['bar', '--goo', 'gar'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, ['--goo', 'gar']);
        expect(invalidArgs).toEqual([]);
    });

    test('Unused positional after global command argument', () => {

        const command: GlobalCommand = {
            name: 'foo',
            argument: {
                name: 'value',
                type: ArgumentValueTypeName.String
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            run: async (): Promise<void> => { }
        };

        const invalidArgs: InvalidArg[] = [];
        const result = populateGlobalCommandValue(command, ['bar', 'goo'], invalidArgs);
        expectExtractResult(result, { value: 'bar' }, ['goo']);
        expect(invalidArgs).toEqual([]);
    });
});
