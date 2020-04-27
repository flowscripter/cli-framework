/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import * as fs from 'fs';
import debug from 'debug';
import { PluginManager } from '@flowscripter/esm-dynamic-plugins';
import Service from '../../api/Service';
import Context from '../../api/Context';
import {
    COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
    SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID
} from '../PluginExtensionPoints';
import ServiceFactory from '../../api/ServiceFactory';
import CommandFactory from '../../api/CommandFactory';

export const PLUGIN_REGISTRY_SERVICE = '@flowscripter/cli-framework/plugin-registry-service';

/**
 * Interface to be implemented by a [[Service]] allowing management of plugins.
 */
export default interface PluginRegistry {

    /**
     * The location of installed plugins which should be available once the service is initialised.
     */
    pluginLocation: string | undefined;

    /**
     * Scan for any available plugins which have not already been registered and register them.
     * Any plugins discovered for:
     *
     * * the [[COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID]] extension point will be added as
     * new [[Command]] implementations in the provided [[Context]].
     * * the [[SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID]] extension point will be added as
     * new [[Service]] implementations in the provided [[Context]].
     */
    scan(context: Context): void;
}

/**
 * Core implementation of [[PluginRegistry]] exposed as a [[Service]].
 */
export class PluginRegistryService implements Service, PluginRegistry {

    private readonly log: debug.Debugger = debug('PluginRegistryService');

    public readonly id = PLUGIN_REGISTRY_SERVICE;

    public readonly initPriority: number;

    private pluginManager: PluginManager<string> | undefined;

    public pluginLocation: string | undefined;

    /**
     * Create a [[PluginRegistry]] service using the provided esm-dynamic-modules PluginManager.
     *
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(initPriority: number) {
        this.initPriority = initPriority;
    }

    /**
     * @param pluginManager an esm-dynamic-modules PluginManager to use
     */
    private async* makeServiceFactoryIterator(pluginManager: PluginManager<string>): AsyncIterable<ServiceFactory> {
        for (const extensionInfo of pluginManager.getExtensions(SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID)) {
            this.log(`Extension for ${
                SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID} has data: ${extensionInfo.extensionData}`);
            this.log(`Plugin for ${
                SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID} has data: ${extensionInfo.pluginData}`);

            yield pluginManager.instantiate(extensionInfo.extensionHandle, this.id);
        }
    }

    /**
     * @param pluginManager an esm-dynamic-modules PluginManager to use
     */
    private async* makeCommandFactoryIterator(pluginManager: PluginManager<string>): AsyncIterable<CommandFactory> {
        for (const extensionInfo of pluginManager.getExtensions(COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID)) {
            this.log(`Extension for ${
                COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID} has data: ${extensionInfo.extensionData}`);
            this.log(`Plugin for ${
                COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID} has data: ${extensionInfo.pluginData}`);

            yield pluginManager.instantiate(extensionInfo.extensionHandle, this.id);
        }
    }

    /**
     * @inheritdoc
     *
     * Instantiates the esm-dynamic-plugins PluginManager implementation provided in the [[Context]]
     * `cliConfig.pluginManagerConfig.pluginManager` property with the plugin location provided in the [[Context]]
     * `cliConfig.pluginManagerConfig.pluginLocation` property.
     *
     * If a `pluginLocation` property is provided in the service's config this will be used
     * in preference to that provided in the `cliConfig.pluginManagerConfig.pluginLocation` property.
     *
     * Once the PluginManager is initialised, the extensions [[SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID]] and
     * [[COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID]] will be registered. Following this, [[scan]] will be invoked.
     *
     * @throws *Error* if a non-default plugin location is specified in the service's configuration and it
     * does not exist, cannot be read or is not a folder
     */
    public async init(context: Context): Promise<void> {
        if (_.isUndefined(context.cliConfig.pluginManagerConfig)) {
            throw new Error('Provided context is missing property: "cliConfig.pluginManagerConfig"');
        }

        let customLocation = false;

        // determine actual config file path
        const pluginServiceConfig = context.serviceConfigs.get(this.id);
        if (!_.isUndefined(pluginServiceConfig)) {
            if (!_.isString(pluginServiceConfig.pluginLocation)) {
                throw new Error('The configured "pluginLocation" is not a string!');
            }
            this.pluginLocation = pluginServiceConfig.pluginLocation;
            customLocation = true;
        } else {
            this.pluginLocation = context.cliConfig.pluginManagerConfig.pluginLocation;
        }
        this.log(`Using pluginLocation: ${this.pluginLocation}`);

        if (_.isUndefined(this.pluginLocation)) {
            throw new Error('Logic error: this.pluginLocation is undefined!');
        }
        try {
            fs.accessSync(this.pluginLocation, fs.constants.F_OK);
        } catch (err) {
            if (customLocation) {
                throw new Error(`pluginLocation: ${this.pluginLocation} doesn't exist or not visible!`);
            } else {
                this.log(`pluginLocation: ${this.pluginLocation} doesn't exist or not visible - ignoring`);
            }
        }

        let locationExists = false;
        try {
            fs.accessSync(this.pluginLocation, fs.constants.R_OK);
            locationExists = true;
        } catch (err) {
            if (customLocation) {
                throw new Error(`pluginLocation: ${this.pluginLocation} is not readable!`);
            } else {
                this.log(`pluginLocation: ${this.pluginLocation} is not readable - ignoring`);
            }
        }

        if (locationExists) {
            const stats = fs.statSync(this.pluginLocation);
            if (!stats.isDirectory()) {
                if (customLocation) {
                    throw new Error(`pluginLocation: ${this.pluginLocation} is not a directory!`);
                } else {
                    this.log(`pluginLocation: ${
                        this.pluginLocation} is not a directory - ignoring, no plugins will be loaded`);
                }
            }
        }

        if (locationExists) {
            // eslint-disable-next-line new-cap
            this.pluginManager = new context.cliConfig.pluginManagerConfig.pluginManager([this.pluginLocation]);

            if (_.isUndefined(this.pluginManager)) {
                throw new Error('Logic error: this.pluginManager is undefined!');
            }

            this.pluginManager.registerExtensionPoint(SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID);
            this.pluginManager.registerExtensionPoint(COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID);

            await this.scan(context);
        }
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if there is an issue while scanning.
     */
    public async scan(context: Context): Promise<void> {

        if (_.isUndefined(this.pluginManager)) {
            throw new Error('"pluginManager" is undefined, has init() been invoked?');
        }

        let pluginCount = await
        this.pluginManager.registerPluginsByExtensionPoint(SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID);

        pluginCount += await
        this.pluginManager.registerPluginsByExtensionPoint(COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID);
        this.log(`Registered ${pluginCount} new plugins(s)`);

        let i = 0;
        for await (const serviceFactory of this.makeServiceFactoryIterator(this.pluginManager)) {
            const services = Array.from(serviceFactory.getServices());
            for (const service of services.sort((a, b) => (a.initPriority >= b.initPriority ? 1 : 0))) {

                // add to the service registry
                context.serviceRegistry.addService(service);

                this.log(`Initialising service: ${service.id}`);
                // eslint-disable-next-line no-await-in-loop
                await service.init(context);

                i += 1;
            }
        }
        this.log(`Registered ${i} new services(s)`);

        i = 0;
        for await (const commandFactory of this.makeCommandFactoryIterator(this.pluginManager)) {
            for (const command of commandFactory.getCommands()) {

                // add to the command registry
                context.commandRegistry.addCommand(command);

                i += 1;
            }
        }
        this.log(`Registered ${i} new command(s)`);
    }
}
