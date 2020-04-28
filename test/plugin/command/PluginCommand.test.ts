/* eslint-disable @typescript-eslint/no-non-null-assertion */

import PluginCommand from '../../../src/plugin/command/PluginCommand';
import { AddCommand, RemoveCommand } from '../../../src/plugin/command/AddRemoveCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import { CommandArgs } from '../../../src';

describe('PluginCommand test', () => {

    test('PluginCommand is instantiable', () => {
        expect(new PluginCommand()).toBeInstanceOf(PluginCommand);
    });

    test('PluginCommand expects valid config properties in context', async () => {
        const pluginCommand = new PluginCommand();

        let context = getContext(getCliConfig(), [], [], new Map(), new Map());
        await pluginCommand.run({}, context);

        const configMap = new Map<string, CommandArgs>();

        configMap.set(pluginCommand.name, {
            remoteModuleRegistry: 1
        });
        context = getContext(getCliConfig(), [], [], new Map(), configMap);
        await expect(pluginCommand.run({}, context)).rejects.toThrowError();

        configMap.set(pluginCommand.name, {
            localModuleCacheLocation: 1
        });
        context = getContext(getCliConfig(), [], [], new Map(), configMap);
        await expect(pluginCommand.run({}, context)).rejects.toThrowError();

        configMap.set(pluginCommand.name, {
            modulePrefix: 1
        });
        context = getContext(getCliConfig(), [], [], new Map(), configMap);
        await expect(pluginCommand.run({}, context)).rejects.toThrowError();
    });

    test('PluginCommand adds config properties in context', async () => {
        const pluginCommand = new PluginCommand();
        const configMap = new Map<string, CommandArgs>();
        const context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(AddCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(AddCommand.name)!.modulePrefix).toEqual('');

        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(RemoveCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(RemoveCommand.name)!.modulePrefix).toEqual('');
    });

    test('PluginCommand updates but does not overwrite config properties in context', async () => {
        const pluginCommand = new PluginCommand();
        const configMap = new Map<string, CommandArgs>();
        configMap.set(AddCommand.name, { foo: 'bar' });
        configMap.set(RemoveCommand.name, { goo: 'gar' });

        let context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(AddCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(AddCommand.name)!.modulePrefix).toEqual('');

        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(RemoveCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(RemoveCommand.name)!.modulePrefix).toEqual('');

        configMap.set(pluginCommand.name, {
            remoteModuleRegistry: 'a',
            localModuleCacheLocation: 'b',
            modulePrefix: 'c'
        });

        context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(AddCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(AddCommand.name)!.modulePrefix).toEqual('');

        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect((configMap.get(RemoveCommand.name)!.localModuleCacheLocation as string).includes('.npm')).toBeTruthy();
        expect(configMap.get(RemoveCommand.name)!.modulePrefix).toEqual('');

        configMap.set(AddCommand.name, { foo: 'bar' });
        configMap.set(RemoveCommand.name, { goo: 'gar' });

        context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('a');
        expect(configMap.get(AddCommand.name)!.localModuleCacheLocation).toEqual('b');
        expect(configMap.get(AddCommand.name)!.modulePrefix).toEqual('c');

        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('a');
        expect(configMap.get(RemoveCommand.name)!.localModuleCacheLocation).toEqual('b');
        expect(configMap.get(RemoveCommand.name)!.modulePrefix).toEqual('c');
    });
});
