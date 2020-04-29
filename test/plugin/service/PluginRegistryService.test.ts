import path from 'path';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import mockFs from 'mock-fs';
import { PLUGIN_REGISTRY_SERVICE, PluginRegistryService } from '../../../src/plugin/service/PluginRegistryService';
import Context from '../../../src/api/Context';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';

describe('PluginRegistryService test', () => {

    afterEach(() => {
        mockFs.restore();
    });

    test('PluginRegistryService is instantiable', () => {
        expect(new PluginRegistryService(100)).toBeInstanceOf(PluginRegistryService);
    });

    test('Error if cliConfig.pluginManagerConfig missing', async () => {
        const pluginRegistry = new PluginRegistryService(100);
        const cliConfig = getCliConfig();

        const context: Context = getContext(cliConfig, [], []);
        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('PluginRegistry init works with default location', async () => {
        const pluginRegistry = new PluginRegistryService(100);
        const context: Context = getContext(getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        }), [], []);
        await pluginRegistry.init(context);
    });

    test('PluginRegistry init works with default module scope', async () => {
        const pluginRegistry = new PluginRegistryService(100);
        const context: Context = getContext(getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        }), [], []);
        await pluginRegistry.init(context);
        expect(pluginRegistry.moduleScope).toBeUndefined();
    });

    test('PluginRegistry init works with non-default location', async () => {
        const pluginRegistry = new PluginRegistryService(100);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginLocation: '/plugins2'
        });
        const context: Context = getContext(getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'node_modules')
        }), [], [], serviceConfigs);

        mockFs({
            '/plugins2': {
                hello: 'world'
            }
        });
        await pluginRegistry.init(context);

        expect(pluginRegistry.pluginLocation).toEqual('/plugins2');
    });

    test('PluginRegistry init works with non-default module scope', async () => {
        const pluginRegistry = new PluginRegistryService(100);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            moduleScope: '@foo'
        });
        const context: Context = getContext(getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'node_modules')
        }), [], [], serviceConfigs);

        mockFs({
            '/plugins2': {
                hello: 'world'
            }
        });
        await pluginRegistry.init(context);
        expect(pluginRegistry.moduleScope).toEqual('@foo');
    });

    test('PluginRegistry init works with invalid default folder', async () => {
        const pluginRegistry = new PluginRegistryService(100);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });

        const context: Context = getContext(cliConfig, [], []);

        mockFs({});

        await pluginRegistry.init(context);

        mockFs({
            '/plugins': 'hello'
        });

        await pluginRegistry.init(context);
    });

    test('PluginRegistry init fails with invalid custom folder', async () => {
        const pluginRegistry = new PluginRegistryService(100);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(PLUGIN_REGISTRY_SERVICE, {
            pluginLocation: '/plugins2'
        });
        const context: Context = getContext(cliConfig, [], [], serviceConfigs);

        mockFs({
            '/plugins': {
                hello: 'world'
            }
        });

        await expect(pluginRegistry.init(context)).rejects.toThrowError();

        mockFs({
            '/plugins2': 'hello'
        });

        await expect(pluginRegistry.init(context)).rejects.toThrowError();
    });

    test('PluginRegistry discovers plugins', async () => {
        const pluginRegistry = new PluginRegistryService(100);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: path.join(process.cwd(), 'test/fixtures')
        });

        const context: Context = getContext(cliConfig, [], []);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(0);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(0);

        await pluginRegistry.init(context);

        expect(Array.from(context.serviceRegistry.getServices())).toHaveLength(1);
        expect(Array.from(context.commandRegistry.getCommands())).toHaveLength(1);
    });
});
