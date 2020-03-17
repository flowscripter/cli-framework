import { validateOptionValue, validatePositionalValue, validateGlobalCommandArgumentValue }
    from '../../../src/runtime/parser/ArgumentValueValidation';
import Option from '../../../src/api/Option';
import { InvalidArg, InvalidReason } from '../../../src/api/Parser';
import Positional from '../../../src/api/Positional';
import { ArgumentValueTypeName } from '../../../src/api/ArgumentValueType';
import GlobalCommandArgument from '../../../src/api/GlobalCommandArgument';

describe('ArgumentsValidation test', () => {

    test('Option types', () => {

        let option: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        let invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, 'foo', invalidArgs)).toEqual('foo');
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Number
        };
        expect(validateOptionValue(option, '1', invalidArgs)).toEqual(1);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean
        };
        expect(validateOptionValue(option, 'true', invalidArgs)).toBe(true);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        expect(validateOptionValue(option, '1', invalidArgs)).toEqual('1');
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Number
        };
        expect(validateOptionValue(option, 'foo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean
        };
        invalidArgs = [];
        expect(validateOptionValue(option, 'foo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);
    });

    test('Option type not specified', () => {

        const option: Option = {
            name: 'foo'
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, 'foo', invalidArgs)).toEqual('foo');
        expect(invalidArgs).toEqual([]);
    });

    test('Option array', () => {

        let option: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isArray: true
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, ['foo', 'bar'], invalidArgs)).toEqual(['foo', 'bar']);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Number,
            isArray: true
        };
        expect(validateOptionValue(option, ['1', '2'], invalidArgs)).toEqual([1, 2]);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean,
            isArray: true
        };
        expect(validateOptionValue(option, ['true', 'false'], invalidArgs)).toEqual([true, false]);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo'
        };
        expect(validateOptionValue(option, ['true', 'false'], invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: ['true', 'false'],
            reason: InvalidReason.IllegalMultipleValues
        }]);
    });

    test('Default option value', () => {

        let option: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            defaultValue: 'bar'
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, undefined, invalidArgs)).toEqual('bar');
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isArray: true,
            defaultValue: ['bar', 'two']
        };
        expect(validateOptionValue(option, undefined, invalidArgs)).toEqual(['bar', 'two']);
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isArray: true,
            defaultValue: 'bar'
        };
        expect(validateOptionValue(option, undefined, invalidArgs)).toEqual('bar');
        expect(invalidArgs).toEqual([]);
    });

    test('Optional option', () => {

        let option: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isOptional: true
        };
        let invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isArray: true,
            isOptional: true
        };
        expect(validateOptionValue(option, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        expect(validateOptionValue(option, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            reason: InvalidReason.MissingValue
        }]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isArray: true
        };
        invalidArgs = [];
        expect(validateOptionValue(option, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            reason: InvalidReason.MissingValue
        }]);
    });

    test('Invalid option argument value', () => {

        let option: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateOptionValue(option, 'bar', invalidArgs)).toEqual('bar');
        expect(invalidArgs).toEqual([]);

        option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        expect(validateOptionValue(option, 'goo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'goo',
            reason: InvalidReason.IllegalValue
        }]);
    });

    test('Positional types', () => {

        let positional: Positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        let invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, 'foo', invalidArgs)).toEqual('foo');
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Number
        };
        expect(validatePositionalValue(positional, '1', invalidArgs)).toEqual(1);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean
        };
        expect(validatePositionalValue(positional, 'true', invalidArgs)).toBe(true);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        expect(validatePositionalValue(positional, '1', invalidArgs)).toEqual('1');
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Number
        };
        expect(validatePositionalValue(positional, 'foo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean
        };
        invalidArgs = [];
        expect(validatePositionalValue(positional, 'foo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);
    });

    test('Positional varargs multiple', () => {

        let positional: Positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgMultiple: true
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, ['foo', 'bar'], invalidArgs)).toEqual(['foo', 'bar']);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Number,
            isVarArgMultiple: true
        };
        expect(validatePositionalValue(positional, ['1', '2'], invalidArgs)).toEqual([1, 2]);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean,
            isVarArgMultiple: true
        };
        expect(validatePositionalValue(positional, ['true', 'false'], invalidArgs)).toEqual([true, false]);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean,
            isVarArgMultiple: true
        };
        expect(validatePositionalValue(positional, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: undefined,
            reason: InvalidReason.MissingValue
        }]);
    });

    test('Positional varargs optional', () => {

        let positional: Positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgOptional: true
        };
        let invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgOptional: true
        };
        expect(validatePositionalValue(positional, 'foo', invalidArgs)).toEqual('foo');
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgOptional: true
        };
        expect(validatePositionalValue(positional, ['foo', 'bar'], invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: ['foo', 'bar'],
            reason: InvalidReason.IllegalMultipleValues
        }]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgMultiple: true,
            isVarArgOptional: true
        };
        invalidArgs = [];
        expect(validatePositionalValue(positional, ['foo', 'bar'], invalidArgs)).toEqual(['foo', 'bar']);
        expect(invalidArgs).toEqual([]);
    });

    test('Invalid positional argument value', () => {

        let positional: Option = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, 'bar', invalidArgs)).toEqual('bar');
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        expect(validatePositionalValue(positional, 'goo', invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            value: 'goo',
            reason: InvalidReason.IllegalValue
        }]);
    });

    test('Global command argument types', () => {

        let globalCommandArgument: GlobalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String
        };
        let invalidArgs: InvalidArg[] = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'foo', invalidArgs)).toEqual('foo');
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.Number
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, '1', invalidArgs)).toEqual(1);
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.Boolean
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'true', invalidArgs)).toBe(true);
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, '1', invalidArgs)).toEqual('1');
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.Number
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'foo', invalidArgs))
            .toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'value',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.Boolean
        };
        invalidArgs = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'foo', invalidArgs))
            .toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'value',
            value: 'foo',
            reason: InvalidReason.IncorrectType
        }]);
    });

    test('Global command argument type not specified', () => {

        const globalCommandArgument: GlobalCommandArgument = {
            name: 'value'
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'foo', invalidArgs))
            .toEqual('foo');
        expect(invalidArgs).toEqual([]);
    });

    test('Default global command argument value', () => {

        const globalCommandArgument: GlobalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String,
            defaultValue: 'bar'
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, undefined, invalidArgs))
            .toEqual('bar');
        expect(invalidArgs).toEqual([]);
    });

    test('Optional global command argument', () => {

        let globalCommandArgument: GlobalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String,
            isOptional: true
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, undefined, invalidArgs))
            .toBeUndefined();
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, undefined, invalidArgs))
            .toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'value',
            reason: InvalidReason.MissingValue
        }]);
    });

    test('Invalid global command argument value', () => {

        let globalCommandArgument: GlobalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'bar', invalidArgs))
            .toEqual('bar');
        expect(invalidArgs).toEqual([]);

        globalCommandArgument = {
            name: 'value',
            type: ArgumentValueTypeName.String,
            validValues: ['bar', 'two']
        };
        expect(validateGlobalCommandArgumentValue(globalCommandArgument, 'goo', invalidArgs))
            .toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'value',
            value: 'goo',
            reason: InvalidReason.IllegalValue
        }]);
    });
});
