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

    test('PluginCommand expects valid config property in context', async () => {
        const pluginCommand = new PluginCommand();

        let context = getContext(getCliConfig(), [], [], new Map(), new Map());
        await pluginCommand.run({}, context);

        const configMap = new Map<string, CommandArgs>();

        configMap.set(pluginCommand.name, {
            remoteModuleRegistry: 1
        });
        context = getContext(getCliConfig(), [], [], new Map(), configMap);
        await expect(pluginCommand.run({}, context)).rejects.toThrowError();
    });

    test('PluginCommand adds config property in context', async () => {
        const pluginCommand = new PluginCommand();
        const configMap = new Map<string, CommandArgs>();
        const context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
    });

    test('PluginCommand updates but does not overwrite config property in context', async () => {
        const pluginCommand = new PluginCommand();
        const configMap = new Map<string, CommandArgs>();
        configMap.set(AddCommand.name, { foo: 'bar' });
        configMap.set(RemoveCommand.name, { goo: 'gar' });

        let context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');

        configMap.set(pluginCommand.name, {
            remoteModuleRegistry: 'a'
        });

        context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');
        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('https://registry.npmjs.org/');

        configMap.set(AddCommand.name, { foo: 'bar' });
        configMap.set(RemoveCommand.name, { goo: 'gar' });

        context = getContext(getCliConfig(), [], [], new Map(), configMap);

        await pluginCommand.run({}, context);

        expect(configMap.get(AddCommand.name)!.foo).toEqual('bar');
        expect(configMap.get(RemoveCommand.name)!.goo).toEqual('gar');

        expect(configMap.get(AddCommand.name)!.remoteModuleRegistry).toEqual('a');
        expect(configMap.get(RemoveCommand.name)!.remoteModuleRegistry).toEqual('a');
    });
});
