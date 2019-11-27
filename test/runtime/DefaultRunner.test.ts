/* eslint-disable @typescript-eslint/no-unused-vars */

import DefaultRunner from '../../src/runtime/DefaultRunner';
import Option from '../../src/api/Option';
import Positional from '../../src/api/Positional';
import Command from '../../src/api/Command';
import { Icon, Level, PRINTER_SERVICE } from '../../src/core/service/PrinterService';
import Context from '../../src/api/Context';
import Service from '../../src/api/Service';

function getCommand<S_ID>(name: string, aliases: string[], isGlobal: boolean, isGlobalQualifier: boolean,
    isDefault: boolean, options: Option[], positionals: Positional[]) {
    return {
        name,
        aliases,
        isGlobal,
        isGlobalQualifier,
        options,
        positionals,
        isDefault,
        run: async (): Promise<void> => { }
    };
}

const dummyContext: Context<string> = {

    getService: (serviceId: string): Service<string> | null => {
        if (serviceId === PRINTER_SERVICE) {
            return {
                serviceId: PRINTER_SERVICE,
                colorEnabled: false,
                debug: (message: string, icon?: Icon): void => {},
                info: (message: string, icon?: Icon): void => {},
                warn: (message: string, icon?: Icon): void => {},
                error: (message: string, icon?: Icon): void => {},
                showSpinner: (message: string): void => {},
                hideSpinner: (): void => {},
                setLevel: (level: Level): void => {}
            } as Service<string>;
        }
        return null;
    }
};

describe('DefaultRunner test', () => {

    test('DefaultRunner is instantiable', () => {
        expect(new DefaultRunner<string>(PRINTER_SERVICE)).toBeInstanceOf(DefaultRunner);
    });

    test('Check for multiple default commands', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('c1', [], false, false, true, [{
            name: 'foo1'
        }], []);

        const command2 = getCommand('c2', [], false, false, true, [{
            name: 'foo1'
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Check for duplicate command name', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('c1', [], false, false, false, [{
            name: 'foo1'
        }], []);

        const command2 = getCommand('c1', [], false, false, false, [{
            name: 'foo1'
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Check for duplicate command name and alias', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('command1', [], false, false, false, [{
            name: 'f'
        }], []);

        const command2 = getCommand('command2', ['command1'], false, false, false, [{
            name: 'foo',
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Check for global/qualifier command name duplicating existing option name', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('c1', [], false, false, false, [{
            name: 'foo',
            shortAlias: 'f'
        }], []);

        const command2 = getCommand('foo', [], true, false, false, [{
            name: 'foo1'
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Check for global/qualifier command alias duplicating existing option name', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('c1', [], false, false, false, [{
            name: 'foo',
            shortAlias: 'f'
        }], []);

        const command2 = getCommand('c2', ['foo'], true, false, false, [{
            name: 'foo1'
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Check for global/qualifier command alias duplicating existing option shortAlias', () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1 = getCommand('c1', [], false, false, false, [{
            name: 'foo',
            shortAlias: 'f'
        }], []);

        const command2 = getCommand('c2', ['f'], true, false, false, [{
            name: 'foo1'
        }], []);

        runner.addCommand(command1);
        expect(() => {
            runner.addCommand(command2);
        }).toThrow();
    });

    test('Non-global run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        runner.addCommand(command);
        await runner.run(['command', '--foo', 'bar'], dummyContext);

        expect(hasRun).toBe(true);
    });

    test('Global run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        runner.addCommand(command);
        await runner.run(['--command=bar'], dummyContext);

        expect(hasRun).toBe(true);
    });

    test('Default run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            isDefault: true,
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        runner.addCommand(command);
        await runner.run(['--foo=bar'], dummyContext);

        expect(hasRun).toBe(true);
    });

    test('Global qualifier and non-global run scenario', async () => {

        let hasRun1 = false;
        let hasRun2 = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command1',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { hasRun1 = true; }
        };

        const command2: Command<string> = {
            name: 'command2',
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun2 = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        await runner.run(['--command1=bar', 'command2', '--foo', 'bar'], dummyContext);

        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(true);
    });

    test('Global qualifier and global run scenario', async () => {

        let hasRun1 = false;
        let hasRun2 = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command1',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { hasRun1 = true; }
        };

        const command2: Command<string> = {
            name: 'command2',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun2 = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        await runner.run(['--command1', 'gar', '--command2', 'bar'], dummyContext);

        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(true);
    });

    test('Global qualifier and default run scenario', async () => {

        let hasRun1 = false;
        let hasRun2 = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { hasRun1 = true; }
        };

        const command2: Command<string> = {
            name: 'command2',
            isDefault: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun2 = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        await runner.run(['--command', 'gar', 'bar'], dummyContext);

        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(true);

        hasRun1 = false;
        hasRun2 = false;

        await runner.run(['bar', '--command', 'gar'], dummyContext);

        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(true);
    });

    test('Default not added fails run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            isDefault: true,
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        await expect(runner.run(['--foo=bar'], dummyContext)).rejects.toThrowError();
        expect(hasRun).toBe(false);

        runner.addCommand(command);
        await runner.run(['--foo=bar'], dummyContext);
        expect(hasRun).toBe(true);
    });

    test('Error thrown in non-global run scenario', async () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { throw new Error(); }
        };

        runner.addCommand(command);
        await expect(runner.run(['command', '--foo', 'bar'], dummyContext)).rejects.toThrowError();
    });

    test('Error thrown in global run scenario', async () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { throw new Error(); }
        };

        runner.addCommand(command);
        await expect(runner.run(['--command=bar'], dummyContext)).rejects.toThrowError();
    });

    test('Error thrown default run scenario', async () => {

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            isDefault: true,
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { throw new Error(); }
        };

        runner.addCommand(command);
        await expect(runner.run(['--foo=bar'], dummyContext)).rejects.toThrowError();
    });

    test('Error thrown in global qualifier run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command1',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { throw new Error(); }
        };

        const command2: Command<string> = {
            name: 'command2',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        await expect(runner.run(['--command1', 'gar', '--command2', 'bar'], dummyContext)).rejects.toThrowError();
        expect(hasRun).toBe(false);
    });

    test('Parse error in non-global run scenario', async () => {

        let hasRun = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command: Command<string> = {
            name: 'command',
            options: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun = true; }
        };

        runner.addCommand(command);
        await expect(runner.run(['command', '--foo'], dummyContext)).rejects.toThrowError();
        expect(hasRun).toBe(false);
    });

    test('Parse error in global with global qualifier run scenario', async () => {

        let hasRun1 = false;
        let hasRun2 = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command1',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { hasRun1 = true; }
        };

        const command2: Command<string> = {
            name: 'command2',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun2 = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        await expect(runner.run(['--command1', 'gar', '--command2'],
            dummyContext)).rejects.toThrowError();
        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(false);
    });

    test('Unused args in qualifier and non-global run scenario', async () => {

        let hasRun1 = false;
        let hasRun2 = false;

        const runner = new DefaultRunner<string>(PRINTER_SERVICE);

        const command1: Command<string> = {
            name: 'command1',
            isGlobal: true,
            isGlobalQualifier: true,
            positionals: [{
                name: 'goo'
            }],
            run: async (): Promise<void> => { hasRun1 = true; }
        };

        const command2: Command<string> = {
            name: 'command2',
            isGlobal: true,
            positionals: [{
                name: 'foo'
            }],
            run: async (): Promise<void> => { hasRun2 = true; }
        };

        runner.addCommand(command1);
        runner.addCommand(command2);
        // TODO: assert unused args: boo gar2 bar2
        await runner.run(['boo', '--command1', 'gar1', 'gar2', '--command2', 'bar1', 'bar2'], dummyContext);
        expect(hasRun1).toBe(true);
        expect(hasRun2).toBe(true);
    });

    // TODO: check error without print service, and not with
});
