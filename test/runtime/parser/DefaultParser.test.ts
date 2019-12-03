import DefaultParser from '../../../src/runtime/parser/DefaultParser';
import { ScanResult, ParseResult } from '../../../src/runtime/parser/Parser';
import Command from '../../../src/api/Command';
import { ArgumentValueTypeName } from '../../../src/api/Argument';

function expectScanResult(result: ScanResult, expected: ScanResult) {

    expect(result.unusedLeadingArgs).toEqual(expected.unusedLeadingArgs);
    expect(result.commandClauses).toEqual(expected.commandClauses);
}

function expectParseResult(result: ParseResult, expected: ParseResult) {

    expect(result.unusedArgs).toEqual(expected.unusedArgs);
    expect(result.invalidArgs).toEqual(expected.invalidArgs);
    expect(result.commandArgs).toEqual(expected.commandArgs);
}

function getCommand(): Command {
    return {
        name: 'command',
        options: [{
            name: 'goo',
            type: ArgumentValueTypeName.String
        }],
        positionals: [{
            name: 'foo',
            type: ArgumentValueTypeName.String
        }],
        run: async (): Promise<void> => { }
    };
}

function getGlobalCommand(): Command {
    return {
        name: 'globalCommand',
        isGlobal: true,
        positionals: [{
            name: 'goo'
        }, {
            name: 'foo'
        }],
        run: async (): Promise<void> => { }
    };
}

function getGlobalQualifierCommand(name: string): Command {
    return {
        name,
        isGlobal: true,
        isGlobalQualifier: true,
        positionals: [{
            name: 'goo'
        }, {
            name: 'foo'
        }],
        run: async (): Promise<void> => { }
    };
}

describe('DefaultParser test', () => {

    test('DefaultParser is instantiable', () => {
        expect(new DefaultParser()).toBeInstanceOf(DefaultParser);
    });

    test('Command not scanned if not added', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        let scanResult = defaultParser.scanForCommandClauses(['command', 'foo', '--goo', 'g']);

        expectScanResult(scanResult, {
            commandClauses: [],
            unusedLeadingArgs: ['command', 'foo', '--goo', 'g']
        });

        scanResult = defaultParser.scanForCommandClauses(['--command', 'foo', '--goo', 'g']);

        expectScanResult(scanResult, {
            commandClauses: [],
            unusedLeadingArgs: ['--command', 'foo', '--goo', 'g']
        });
    });

    test('Global command scanned if added', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([globalCommand]);

        const expected = {
            commandClauses: [{
                command: globalCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses(['--globalCommand', 'g', 'bar']);

        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['--globalCommand=g', 'bar']);

        expectScanResult(scanResult, expected);
    });

    test('Global qualifier command scanned if added', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand = getGlobalQualifierCommand('qualifier');

        defaultParser.setCommands([qualifierCommand]);

        const expected = {
            commandClauses: [{
                command: qualifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses(['--qualifier', 'g', 'bar']);

        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['--qualifier=g', 'bar']);

        expectScanResult(scanResult, expected);
    });

    test('Two global qualifier commands scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand1 = getGlobalQualifierCommand('qualifier1');
        const qualifierCommand2 = getGlobalQualifierCommand('qualifier2');

        defaultParser.setCommands([qualifierCommand1, qualifierCommand2]);

        const expected = {
            commandClauses: [{
                command: qualifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: qualifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses([
            '--qualifier1', 'g', 'bar',
            '--qualifier2', 'g', 'bar'
        ]);

        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses([
            '--qualifier1=g', 'bar',
            '--qualifier2=g', 'bar'
        ]);

        expectScanResult(scanResult, expected);
    });

    test('Non-global command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const command = getCommand();

        defaultParser.setCommands([command]);

        const scanResult = defaultParser.scanForCommandClauses(['command', 'bar', '--goo', 'g']);

        expectScanResult(scanResult, {
            commandClauses: [{
                command,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Command scanned and qualifier and global command not scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand = getGlobalQualifierCommand('qualifier');
        const globalCommand = getGlobalCommand();
        const command = getCommand();

        defaultParser.setCommands([qualifierCommand, globalCommand, command]);

        const scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo', 'g'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global qualifier commands and global command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand1 = getGlobalQualifierCommand('qualifier1');
        const qualifierCommand2 = getGlobalQualifierCommand('qualifier2');
        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([qualifierCommand1, qualifierCommand2, globalCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            '--qualifier1', 'g', 'bar',
            '--qualifier2', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command: qualifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: qualifierCommand2,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global qualifier commands and global command scanned out of order', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand1 = getGlobalQualifierCommand('qualifier1');
        const qualifierCommand2 = getGlobalQualifierCommand('qualifier2');
        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([qualifierCommand1, qualifierCommand2, globalCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            '--qualifier1', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
            '--qualifier2', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command: qualifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: qualifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global qualifier commands, global command and non-global command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand1 = getGlobalQualifierCommand('qualifier1');
        const qualifierCommand2 = getGlobalQualifierCommand('qualifier2');
        const globalCommand = getGlobalCommand();
        const command = getCommand();

        defaultParser.setCommands([qualifierCommand1, qualifierCommand2, globalCommand, command]);

        const scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo', 'g',
            '--qualifier1', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
            '--qualifier2', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: qualifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: qualifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Unused leading args whilst scanning', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const qualifierCommand = getGlobalQualifierCommand('qualifier');
        const globalCommand = getGlobalCommand();
        const command = getCommand();

        defaultParser.setCommands([qualifierCommand, globalCommand, command]);

        let scanResult = defaultParser.scanForCommandClauses([
            'hello', '--world',
            'command', 'bar', '--goo', 'g',
            '--qualifier', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: qualifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: ['hello', '--world']
        });

        scanResult = defaultParser.scanForCommandClauses([
            'hello', '--world',
            '--globalCommand', 'bar', '--goo', 'g',
            '--qualifier', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: qualifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: ['hello', '--world']
        });
    });

    test('Arguments parsed', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const command = getCommand();

        defaultParser.setCommands([command]);

        const parseResult = defaultParser.parseCommandClause({
            command,
            potentialArgs: ['bar', '--goo', 'g']
        });

        expectParseResult(parseResult, {
            command,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Arguments parsed with trailing args', () => {
        const defaultParser: DefaultParser = new DefaultParser();

        const command = getCommand();

        defaultParser.setCommands([command]);

        const parseResult = defaultParser.parseCommandClause({
            command,
            potentialArgs: ['bar', '--goo', 'g', 'hello', '--world']
        });

        expectParseResult(parseResult, {
            command,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: ['hello', '--world'],
            invalidArgs: []
        });
    });
});
