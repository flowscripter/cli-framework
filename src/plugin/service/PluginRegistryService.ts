/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, no-await-in-loop */

import _ from 'lodash';
import * as fs from 'fs';
import debug from 'debug';
import { PluginManager } from '@flowscripter/esm-dynamic-plugins';
import Service from '../../api/Service';
import Context from '../../api/Context';

export const PLUGIN_REGISTRY_SERVICE = '@flowscripter/cli-framework/plugin-registry-service';

/**
 * Type alias for a PluginManager class
 */
export type PluginManagerClass = new (paths: Array<string>) => PluginManager<string>;

/**
 * Interface to be implemented by a [[Service]] allowing management of plugins.
 */
export default interface PluginRegistry {

    /**
     * The location of installed plugins which should be available once the service is initialised.
     */
    pluginLocation: string | undefined;

    /**
     * The optional scope of modules which are plugins e.g. if a scope of `@foo` is configured and a plugin
     * name `bar` is specified then the module name used will be `@foo/bar`.
     */
    moduleScope: string | undefined;

    /**
     * Scan for any available plugins which have not already been registered and register them.
     */
    scan(context: Context): void;
}

/**
 * Interface specifying esm-dynamic-plugins PluginManager related configuration for [[PluginRegistryService]].
 */
export interface PluginManagerConfig {

    /**
     * An esm-dynamic-plugins PluginManager implementation class definition.
     */
    readonly pluginManager: PluginManagerClass;

    /**
     * A base storage location for plugins.
     */
    readonly pluginLocation: string;

    /**
     * A scope string for plugin modules e.g. if a scope of `@foo` is configured and a module
     * name `bar` is specified then the module name used will be `@foo/bar`.
     */
    readonly moduleScope?: string;
}

/**
 * Interface configuring how the [[PluginRegistryService]] instantiates each extension
 * implementation discovered.
 */
export interface ExtensionConfig {

    /**
     * Data to be passed in the ExtensionFactory `create()` method when the extension is instantiated.
     */
    readonly hostData: any;

    /**
     * A handler function to be executed once the extension is instantiated.
     */
    readonly handler: (extension: any, context: Context) => Promise<void>;
}

/**
 * Core implementation of [[PluginRegistry]] exposed as a [[Service]].
 */
export class PluginRegistryService implements Service, PluginRegistry {

    private readonly log: debug.Debugger = debug('PluginRegistryService');

    public readonly id = PLUGIN_REGISTRY_SERVICE;

    public readonly initPriority: number;

    public pluginLocation: string | undefined;

    public moduleScope: string | undefined;

    public extensionConfigsByExtensionPoints: Map<string, ExtensionConfig>;

    protected pluginManager: PluginManager<string> | undefined;

    /**
     * Create a [[PluginRegistry]] service using a wrapped esm-dynamic-modules PluginManager.
     *
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     * @param extensionConfigsByExtensionPoints a map of extension point IDs (which will be registered with
     * the PluginManager instance) to an associated ExtensionConfig (which will be used when instantiating each
     * extension).
     */
    public constructor(initPriority: number,
        extensionConfigsByExtensionPoints: Map<string, ExtensionConfig>) {
        this.initPriority = initPriority;
        this.extensionConfigsByExtensionPoints = extensionConfigsByExtensionPoints;
    }

    /**
     * @inheritdoc
     *
     * Expects the provided [[Context]] to contain a [[PluginManagerConfig]] instance for the service's config.
     *
     * Instantiates the esm-dynamic-plugins PluginManager implementation specified in the [[PluginManagerConfig]]
     * from the service's config.
     *
     * If the specified `pluginLocation` in the [[PluginManagerConfig]] does not exist, it will be created.
     *
     * If a `moduleScope` property is provided in the [[PluginManagerConfig]] this will also
     * be set.
     *
     * Once the PluginManager is initialised, [[scan]] will be invoked.
     *
     * @throws *Error* if:
     * * the parent of the specified plugin location does not exist
     * * the plugin location does not exist and it cannot be created
     * * the specified location is not readable or is a file not a directory
     */
    public async init(context: Context): Promise<void> {

        const pluginServiceConfig = context.serviceConfigs.get(this.id) as PluginManagerConfig;
        if (_.isUndefined(pluginServiceConfig)) {
            throw new Error('No [[PluginManagerConfig]] provided as a service config in the context for service!');
        }

        // determine plugin location
        if (!_.isString(pluginServiceConfig.pluginLocation)) {
            throw new Error('The configured "pluginLocation" is not a string!');
        }
        this.pluginLocation = pluginServiceConfig.pluginLocation;
        this.log(`Using pluginLocation: ${this.pluginLocation}`);

        try {
            fs.accessSync(this.pluginLocation, fs.constants.F_OK);
        } catch (err) {
            this.log(`pluginLocation: ${this.pluginLocation} doesn't exist - creating it`);
            try {
                fs.mkdirSync(this.pluginLocation);
            } catch (err2) {
                throw new Error(`Unable to create folder for pluginLocation: ${this.pluginLocation} : ${err.message}`);
            }
        }

        try {
            fs.accessSync(this.pluginLocation, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`pluginLocation: ${this.pluginLocation} is not readable!`);
        }

        const stats = fs.statSync(this.pluginLocation);
        if (!stats.isDirectory()) {
            throw new Error(`pluginLocation: ${this.pluginLocation} is not a directory!`);
        }

        // determine plugin module scope
        if (!_.isUndefined(pluginServiceConfig.moduleScope)) {
            if (!_.isString(pluginServiceConfig.moduleScope)) {
                throw new Error('The configured "moduleScope" is not a string!');
            }
            if (!pluginServiceConfig.moduleScope.startsWith('@')) {
                throw new Error(`The configured "moduleScope" must start with "@": ${pluginServiceConfig.moduleScope}`);
            }
            if (pluginServiceConfig.moduleScope.length < 2) {
                throw new Error('The configured "moduleScope" must be more than "@"!');
            }
            this.moduleScope = pluginServiceConfig.moduleScope;
            this.log(`Using moduleScope: ${this.moduleScope}`);
        }

        if (_.isUndefined(pluginServiceConfig.pluginManager)) {
            throw new Error('"pluginManager" was not specified!');
        }

        // eslint-disable-next-line new-cap
        this.pluginManager = new pluginServiceConfig.pluginManager([this.pluginLocation]);

        for (const extensionPointId of this.extensionConfigsByExtensionPoints.keys()) {
            this.log(`Registering Extension Point ID: ${extensionPointId} with PluginManager`);
            this.pluginManager.registerExtensionPoint(extensionPointId);
        }

        await this.scan(context);
    }

    private async* makeExtensionIterator(pluginManager: PluginManager<string>, extensionPointId: string,
        extensionConfig: ExtensionConfig): AsyncIterable<any> {
        for (const extensionInfo of pluginManager.getExtensions(extensionPointId)) {
            this.log(`Extension for ${extensionPointId} has data: ${extensionInfo.extensionData}`);
            this.log(`Plugin for ${extensionPointId} has data: ${extensionInfo.pluginData}`);

            yield pluginManager.instantiate(extensionInfo.extensionHandle, extensionConfig.hostData);
        }
    }

    private async loadExtensions(pluginManager: PluginManager<string>, registerPromise: Promise<number>,
        extensionPointId: string, context: Context): Promise<void> {

        const extensionConfig = this.extensionConfigsByExtensionPoints.get(extensionPointId);
        if (_.isUndefined(extensionConfig)) {
            throw new Error(`Logic error: extensionConfig is undefined for extensionPointId: ${extensionPointId}`);
        }

        this.log(`Registering Plugins for Extension Point ID: ${extensionPointId}`);
        const pluginCount = await registerPromise;
        this.log(`Registered ${pluginCount} plugins(s)`);

        for await (const extension of this.makeExtensionIterator(pluginManager, extensionPointId, extensionConfig)) {
            await extensionConfig.handler(extension, context);
        }
    }

    /**
     * @inheritdoc
     *
     * This implementation performs the following for each tuple in the provided [[extensionHandlersByExtensionPoints]]:
     * * register plugins for the extension point ID
     * * get any extensions from the PluginManager for this extension point ID
     * * pass each extension to the provided extension handler function associated with the extension point ID
     *
     * @throws *Error* if there is an issue while scanning of if called before [[init()]] is invoked.
     */
    public async scan(context: Context): Promise<void> {

        if (_.isUndefined(this.pluginManager)) {
            throw new Error('"pluginManager" is undefined, has init() been invoked?');
        }

        const loadPromises: Array<Promise<void>> = [];
        for (const extensionPointId of this.extensionConfigsByExtensionPoints.keys()) {
            let registerPromise: Promise<number>;
            if (!_.isUndefined(this.moduleScope)) {
                registerPromise = this.pluginManager.registerPluginsByModuleScopeAndExtensionPoint(this.moduleScope,
                    extensionPointId);
            } else {
                registerPromise = this.pluginManager.registerPluginsByExtensionPoint(extensionPointId);
            }
            loadPromises.push(this.loadExtensions(this.pluginManager, registerPromise, extensionPointId, context));
        }
        await Promise.all(loadPromises);
    }

    /**
     * Provides access to the wrapped esm-dynamic-plugins `PluginManager` instance.
     *
     * @throws *Error* if this is called before [[init()]] is invoked.
     */
    public getPluginManager(): PluginManager<string> {

        if (_.isUndefined(this.pluginManager)) {
            throw new Error('"pluginManager" is undefined, has init() been invoked?');
        }
        return this.pluginManager;
    }
}
