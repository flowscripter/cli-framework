import { validateOptionValue, validatePositionalValue } from '../../../src/runtime/parser/ArgumentsValidation';
import Option from '../../../src/api/Option';
import { InvalidArg, InvalidReason } from '../../../src/runtime/parser/Parser';
import { ArgumentValueTypeName } from '../../../src/api/Argument';
import Positional from '../../../src/api/Positional';

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

    test('Positional varargs', () => {

        let positional: Positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArg: true
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, ['foo', 'bar'], invalidArgs)).toEqual(['foo', 'bar']);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Number,
            isVarArg: true
        };
        expect(validatePositionalValue(positional, ['1', '2'], invalidArgs)).toEqual([1, 2]);
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.Boolean,
            isVarArg: true
        };
        expect(validatePositionalValue(positional, ['true', 'false'], invalidArgs)).toEqual([true, false]);
        expect(invalidArgs).toEqual([]);
    });

    test('Positional varargs optional', () => {

        let positional: Positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String,
            isVarArgOptional: true
        };
        const invalidArgs: InvalidArg[] = [];
        expect(validatePositionalValue(positional, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([]);

        positional = {
            name: 'foo',
            type: ArgumentValueTypeName.String
        };
        expect(validatePositionalValue(positional, undefined, invalidArgs)).toBeUndefined();
        expect(invalidArgs).toEqual([{
            name: 'foo',
            reason: InvalidReason.MissingValue
        }]);
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
});
