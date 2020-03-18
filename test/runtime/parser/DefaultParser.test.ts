import DefaultParser from '../../../src/runtime/parser/DefaultParser';
import { ScanResult, ParseResult } from '../../../src/api/Parser';
import SubCommand from '../../../src/api/SubCommand';
import GlobalCommand from '../../../src/api/GlobalCommand';
import { ArgumentValueTypeName } from '../../../src/api/ArgumentValueType';
import GroupCommand from '../../../src/api/GroupCommand';
import GlobalModifierCommand from '../../../src/api/GlobalModifierCommand';

function expectScanResult(result: ScanResult, expected: ScanResult) {

    expect(result.unusedLeadingArgs).toEqual(expected.unusedLeadingArgs);
    expect(result.commandClauses).toEqual(expected.commandClauses);
}

function expectParseResult(result: ParseResult, expected: ParseResult) {

    expect(result.unusedArgs).toEqual(expected.unusedArgs);
    expect(result.invalidArgs).toEqual(expected.invalidArgs);
    expect(result.commandArgs).toEqual(expected.commandArgs);
}

function getSubCommand(): SubCommand {
    return {
        name: 'command',
        options: [{
            name: 'goo',
            shortAlias: 'g',
            type: ArgumentValueTypeName.String
        }],
        positionals: [{
            name: 'foo',
            type: ArgumentValueTypeName.String
        }],
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalCommand(): GlobalCommand {
    return {
        name: 'globalCommand',
        shortAlias: 'g',
        argument: {
            name: 'value'
        },
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGlobalModifierCommand(name: string, shortAlias: string): GlobalModifierCommand {
    return {
        name,
        runPriority: 1,
        shortAlias,
        argument: {
            name: 'value'
        },
        run: async (): Promise<void> => {
            // empty
        }
    };
}

function getGroupCommand(name: string, memberSubCommands: ReadonlyArray<SubCommand>): GroupCommand {
    return {
        name,
        memberSubCommands,
        run: async (): Promise<void> => {
            // empty
        }
    };
}

describe('DefaultParser test', () => {

    test('DefaultParser is instantiable', () => {
        expect(new DefaultParser()).toBeInstanceOf(DefaultParser);
    });

    test('Sub-command not scanned if not added', () => {
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

    test('Sub-command member not scanned if parent not specified', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const groupCommand = getGroupCommand('group', [getSubCommand()]);

        defaultParser.setCommands([groupCommand]);

        const scanResult = defaultParser.scanForCommandClauses(['command', 'foo', '--goo', 'g']);
        expectScanResult(scanResult, {
            commandClauses: [],
            unusedLeadingArgs: ['command', 'foo', '--goo', 'g']
        });
    });

    test('Global command scanned', () => {
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

        scanResult = defaultParser.scanForCommandClauses(['-g', 'g', 'bar']);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['-g=g', 'bar']);
        expectScanResult(scanResult, expected);
    });

    test('Global modifier command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand = getGlobalModifierCommand('modifier', 'm');

        defaultParser.setCommands([modifierCommand]);

        const expected = {
            commandClauses: [{
                command: modifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses(['--modifier', 'g', 'bar']);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['--modifier=g', 'bar']);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['-m', 'g', 'bar']);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['-m=g', 'bar']);
        expectScanResult(scanResult, expected);
    });

    test('Two global modifier commands scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');

        defaultParser.setCommands([modifierCommand1, modifierCommand2]);

        const expected = {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses([
            '--modifier1', 'g', 'bar',
            '--modifier2', 'g', 'bar'
        ]);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses([
            '--modifier1=g', 'bar',
            '--modifier2=g', 'bar'
        ]);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses([
            '-1', 'g', 'bar',
            '-2', 'g', 'bar'
        ]);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses([
            '-1=g', 'bar',
            '-2=g', 'bar'
        ]);
        expectScanResult(scanResult, expected);
    });

    test('Sub-command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        const scanResult = defaultParser.scanForCommandClauses(['command', 'bar', '--goo', 'g']);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two sub-commands scanned (illegal scenario)', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        const scanResult = defaultParser.scanForCommandClauses(['command', 'bar', '--goo', 'g']);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Group command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();
        const groupCommand = getGroupCommand('group', [subCommand]);

        defaultParser.setCommands([groupCommand]);

        const expected = {
            commandClauses: [{
                groupCommand,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        };

        let scanResult = defaultParser.scanForCommandClauses(['group', 'command', 'bar', '--goo', 'g']);
        expectScanResult(scanResult, expected);

        scanResult = defaultParser.scanForCommandClauses(['group:command', 'bar', '--goo', 'g']);
        expectScanResult(scanResult, expected);
    });

    test('Two group commands scanned (illegal scenario)', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();
        const groupCommand1 = getGroupCommand('group1', [subCommand]);
        const groupCommand2 = getGroupCommand('group2', [subCommand]);

        defaultParser.setCommands([groupCommand1, groupCommand2]);

        let scanResult = defaultParser.scanForCommandClauses([
            'group1', 'command', 'bar', '--goo', 'g',
            'group2', 'command', 'bar', '--goo', 'g'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                groupCommand: groupCommand1,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                groupCommand: groupCommand2,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });

        scanResult = defaultParser.scanForCommandClauses([
            'group1', 'command', 'bar', '--goo', 'g',
            'group2:command', 'bar', '--goo', 'g'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                groupCommand: groupCommand1,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                groupCommand: groupCommand2,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Sub-command scanned and modifier and global command not scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand = getGlobalModifierCommand('modifier', 'm');
        const globalCommand = getGlobalCommand();
        const subCommand = getSubCommand();

        defaultParser.setCommands([modifierCommand, globalCommand, subCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo', 'g'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global modifier commands and global command scanned', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');
        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([modifierCommand1, modifierCommand2, globalCommand]);

        let scanResult = defaultParser.scanForCommandClauses([
            '--modifier1', 'g', 'bar',
            '--modifier2', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });

        scanResult = defaultParser.scanForCommandClauses([
            '-1', 'g', 'bar',
            '-2', 'g', 'bar',
            '-g', 'bar', '--goo', 'g',
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }],
            unusedLeadingArgs: []
        });

        scanResult = defaultParser.scanForCommandClauses([
            '-1=g', 'bar',
            '-2=g', 'bar',
            '-g=bar', '--goo=g',
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo=g']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global modifier commands and global command scanned out of order', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');
        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([modifierCommand1, modifierCommand2, globalCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            '--modifier1', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
            '--modifier2', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global modifier commands and group command scanned out of order', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');
        const subCommand = getSubCommand();
        const groupCommand = getGroupCommand('group', [subCommand]);

        defaultParser.setCommands([modifierCommand1, modifierCommand2, groupCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            '--modifier1', 'g', 'bar',
            'group:command', 'bar', '--goo', 'g',
            '--modifier2', 'g', 'bar'
        ]);

        expectScanResult(scanResult, {
            commandClauses: [{
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                groupCommand,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global modifier commands, global command and sub-command scanned (illegal scenario)', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');
        const globalCommand = getGlobalCommand();
        const subCommand = getSubCommand();

        defaultParser.setCommands([modifierCommand1, modifierCommand2, globalCommand, subCommand]);

        let scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo', 'g',
            '--modifier1', 'g', 'bar',
            '--globalCommand', 'bar', '--goo', 'g',
            '--modifier2', 'g', 'bar'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });

        scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo=g',
            '-1=g', 'bar',
            '-g=bar', '--goo', 'g',
            '-2=g', 'bar'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo=g']
            }, {
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Two global modifier commands, group command and sub-command scanned (illegal scenario)', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand1 = getGlobalModifierCommand('modifier1', '1');
        const modifierCommand2 = getGlobalModifierCommand('modifier2', '2');
        const subCommand = getSubCommand();
        const groupCommand = getGroupCommand('group', [subCommand]);

        defaultParser.setCommands([modifierCommand1, modifierCommand2, groupCommand, subCommand]);

        const scanResult = defaultParser.scanForCommandClauses([
            'command', 'bar', '--goo', 'g',
            '--modifier1', 'g', 'bar',
            'group:command', 'bar', '--goo', 'g',
            '--modifier2', 'g', 'bar'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand1,
                potentialArgs: ['g', 'bar']
            }, {
                groupCommand,
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand2,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: []
        });
    });

    test('Unused leading args whilst scanning', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const modifierCommand = getGlobalModifierCommand('modifier', 'm');
        const globalCommand = getGlobalCommand();
        const subCommand = getSubCommand();

        defaultParser.setCommands([modifierCommand, globalCommand, subCommand]);

        let scanResult = defaultParser.scanForCommandClauses([
            'hello', '--world',
            'command', 'bar', '--goo', 'g',
            '--modifier', 'g', 'bar'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: subCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: ['hello', '--world']
        });

        scanResult = defaultParser.scanForCommandClauses([
            'hello', '--world',
            '--globalCommand', 'bar', '--goo', 'g',
            '--modifier', 'g', 'bar'
        ]);
        expectScanResult(scanResult, {
            commandClauses: [{
                command: globalCommand,
                potentialArgs: ['bar', '--goo', 'g']
            }, {
                command: modifierCommand,
                potentialArgs: ['g', 'bar']
            }],
            unusedLeadingArgs: ['hello', '--world']
        });
    });

    test('Arguments parsed for sub-command', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        let parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['bar', '--goo', 'g']
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });

        parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['bar', '-g=g']
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Arguments parsed for global command', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const globalCommand = getGlobalCommand();

        defaultParser.setCommands([globalCommand]);

        let parseResult = defaultParser.parseCommandClause({
            command: globalCommand,
            potentialArgs: ['--globalCommand=foo']
        });
        expectParseResult(parseResult, {
            command: globalCommand,
            commandArgs: {
                value: 'foo'
            },
            unusedArgs: [],
            invalidArgs: []
        });

        parseResult = defaultParser.parseCommandClause({
            command: globalCommand,
            potentialArgs: ['-g', 'foo']
        });
        expectParseResult(parseResult, {
            command: globalCommand,
            commandArgs: {
                value: 'foo'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Arguments parsed for global modifier command', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const globalModifierCommand = getGlobalModifierCommand('modifierCommand', 'm');

        defaultParser.setCommands([globalModifierCommand]);

        let parseResult = defaultParser.parseCommandClause({
            command: globalModifierCommand,
            potentialArgs: ['--modifierCommand=foo']
        });
        expectParseResult(parseResult, {
            command: globalModifierCommand,
            commandArgs: {
                value: 'foo'
            },
            unusedArgs: [],
            invalidArgs: []
        });

        parseResult = defaultParser.parseCommandClause({
            command: globalModifierCommand,
            potentialArgs: ['-m', 'foo']
        });
        expectParseResult(parseResult, {
            command: globalModifierCommand,
            commandArgs: {
                value: 'foo'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Arguments parsed with trailing args', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        const parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['bar', '--goo', 'g', 'hello', '--world']
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: ['hello', '--world'],
            invalidArgs: []
        });
    });

    test('All arguments provided in config', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        const parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: []
        }, {
            goo: 'g',
            foo: 'bar'
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Some arguments provided in config', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        let parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['--goo', 'g']
        }, {
            foo: 'bar'
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });

        parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['bar']
        }, {
            goo: 'g'
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });

    test('Extra config provided', () => {
        const defaultParser: DefaultParser = new DefaultParser();
        const subCommand = getSubCommand();

        defaultParser.setCommands([subCommand]);

        const parseResult = defaultParser.parseCommandClause({
            command: subCommand,
            potentialArgs: ['--goo', 'g']
        }, {
            foo: 'bar',
            yee: 'ha'
        });
        expectParseResult(parseResult, {
            command: subCommand,
            commandArgs: {
                goo: 'g',
                foo: 'bar',
                yee: 'ha'
            },
            unusedArgs: [],
            invalidArgs: []
        });
    });
});
