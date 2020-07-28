/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import mockFs from 'mock-fs';
import { PLUGIN_REGISTRY_SERVICE, PluginRegistryService } from '../../../src/plugin/service/PluginRegistryService';
import Context from '../../../src/api/Context';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import {
    COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
    handleLoadedCommandFactory
} from '../../../src/plugin/CommandFactory';
import {
    handleLoadedServiceFactory,
    SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID
} from '../../../src/plugin/ServiceFactory';

describe('PluginRegistryService test', () => {

    afterEach(() => {
        mockFs.restore();
    });

    test('PluginRegistryService is instantiable', () => {
        expect(new PluginRegistryService(100, new Map())).toBeInstanceOf(PluginRegistryService);
    });

    test('Error if pluginManagerConfig missing from context', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());

        const context: Context = getContext(getCliConfig(), [], []);
        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('Error if moduleScope specified and invalid - no @', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins',
            moduleScope: 'foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);
        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('Error if moduleScope specified and invalid - only @', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins',
            moduleScope: '@'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);
        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('PluginRegistry init works with specified location', async () => {
        mockFs({
            '/plugins': {}
        });
        const pluginRegistry = new PluginRegistryService(100, new Map());
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);
        await pluginRegistry.init(context);
    });

    test('PluginRegistry init works with default module scope', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());

        mockFs({
            '/plugins': {}
        });
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins2'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        await pluginRegistry.init(context);
        expect(pluginRegistry.moduleScope).toBeUndefined();
    });

    test('PluginRegistry init works with non-default module scope', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());

        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins2',
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        mockFs({
            '/plugins2': {
                hello: 'world'
            }
        });
        await pluginRegistry.init(context);
        expect(pluginRegistry.moduleScope).toEqual('@foo');
    });

    test('PluginRegistry init fails with invalid folder', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map());
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins2'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        mockFs({
            '/plugins2': 'hello'
        });

        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('PluginRegistry discovers plugins', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map([
            [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
            [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
        ]));
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures')
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(0);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(0);

        await pluginRegistry.init(context);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(2);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(2);
    });

    test('PluginRegistry discovers plugins with scope filtering', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map([
            [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
            [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
        ]));
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures'),
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(0);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(0);

        await pluginRegistry.init(context);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(1);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(1);
    });

    test('PluginRegistry scan works', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map([
            [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
            [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
        ]));
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures'),
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(0);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(0);

        await pluginRegistry.init(context);
        await pluginRegistry.scan(context);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(1);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(1);
    });

    test('PluginRegistry init must be called first', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map([
            [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
            [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
        ]));
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures'),
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        await expect(pluginRegistry.scan(context)).rejects.toThrowError();
        expect(() => pluginRegistry.getPluginManager()).toThrowError();
    });

    test('PluginRegistry getPluginManager works', async () => {
        const pluginRegistry = new PluginRegistryService(100, new Map([
            [SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedServiceFactory as (extension: any, context: Context) => Promise<void>],
            [COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
                handleLoadedCommandFactory as (extension: any, context: Context) => Promise<void>]
        ]));
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures'),
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig(), [], [], serviceConfigs);

        await pluginRegistry.init(context);
        expect(pluginRegistry.getPluginManager()).not.toBeNull();
    });
});
