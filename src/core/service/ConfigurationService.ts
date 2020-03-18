/**
 * @module @flowscripter/cli-framework
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import debug from 'debug';
import * as fs from 'fs';
import * as os from 'os';
import _ from 'lodash';
import yaml from 'js-yaml';
import Service from '../../api/Service';
import Context from '../../api/Context';
import { CommandArgs } from '../..';

export const CONFIGURATION_SERVICE = '@flowscripter/cli-framework/configuration-service';

/**
 * Interface to be implemented by a [[Service]] allowing [[Command]] and [[Service]] instances to manage configuration.
 *
 * The configuration accessed may correspond to defined [[Command]] [[Argument]] definitions or it may be [[Service]]
 * or [[Command]] configuration values not exposed to the user via the command line.
 */
export default interface Configuration {

    /**
     * The location of the configuration which should be available once the service is initialised.
     */
    configurationLocation: string | undefined;

    /**
     * Return all current configuration.
     *
     * @return the current configuration. This object will have the following required properties defined:
     *
     * * *serviceConfigs* a [[Service]] configuration map where the keys are [[Service.id]] values and the values are
     * generic configuration objects.
     * * *commandConfigs* a [[Command]] configuration map where the keys are [[Command.name]] values and the values are
     * in the form of [[CommandArgs]].
     */
    getConfig(): any;

    /**
     * Return current configuration for the specified [[Command]].
     *
     * @param name the name of the [[Command]].
     * @return the [[Command]] configuration.
     */
    getCommandConfig(name: string): CommandArgs;

    /**
     * Return configuration for the specified [[Service]].
     *
     * @param id the ID of the [[Service]].
     * @return the [[Service]] configuration.
     */
    getServiceConfig(id: string): any;

    /**
     * Save configuration for the specified [[Command]]. Any existing configuration for the [[Command]] will be
     * overwritten.
     *
     * @param name the name of the [[Command]].
     * @param commandArgs the [[CommandArgs]] to save.
     */
    setCommandConfig(name: string, commandArgs: CommandArgs): void;

    /**
     * Save configuration for the specified [[Service]]. Any existing configuration for the [[Service]] will be
     * overwritten.
     *
     * @param id the ID of the [[Service]].
     * @param serviceConfig the configuration to save.
     */
    setServiceConfig(id: string, serviceConfig: any): void;
}

/**
 * Core implementation of [[Configuration]] exposed as a [[Service]].
 *
 * The [[configurationLocation]] is expected to be a local file path to a YAML file with the following required
 * properties defined:
 *
 * * *serviceConfigs* a [[Service]] configuration map where the keys are [[Service.id]] values and the values are
 * generic configuration objects.
 * * *commandConfigs* a [[Command]] configuration map where the keys are [[Command.name]] values and the values are
 * in the form of [[CommandArgs]].
 */
export class ConfigurationService implements Service, Configuration {

    private readonly log: debug.Debugger = debug('ConfigurationService');

    readonly id = CONFIGURATION_SERVICE;

    readonly initPriority: number;

    /**
     * The location of the YAML file used for loading and saving configuration.
     */
    public configurationLocation: string | undefined;

    private defaultConfigFilePath: string | undefined;

    /**
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(initPriority: number) {
        this.initPriority = initPriority;
    }

    /**
     * @inheritdoc
     *
     * Parses a YAML configuration file with the following required properties defined:
     *
     * * *serviceConfigs* a [[Service]] configuration map where the keys are [[Service.id]] values and the values are
     * generic configuration objects.
     * * *commandConfigs* a [[Command]] configuration map where the keys are [[Command.name]] values and the values are
     * in the form of [[CommandArgs]].
     *
     * If there is an entry in the provided [[Context]] at *context.serviceConfigs[<this.id>].configurationLocation*
     * this will be set as the value of [[configurationLocation]] and used as the path from which to load the
     * configuration. If this entry does not exist, a default location of *$HOME/.<context.cliConfig.name>.yaml* will
     * be set and used.
     *
     * The loaded and parsed configuration will be used to replace the *serviceConfigs* and [[commandConfigs]]
     * properties on the provided [[Context]]. This implies that any existing configuration on these properties
     * in the [[Context]] will be removed.
     *
     * @throws *Error* if:
     * * a non-default location is specified and it does not exist, cannot be read or cannot be parsed
     * * the default location is used and it exists and can be read but cannot be parsed
     * * *context.cliConfig.name* is not defined
     */
    public init(context: Context): void {

        // determine default config file pathh
        if (_.isUndefined(context.cliConfig) || _.isUndefined(context.cliConfig.name)) {
            throw new Error('context.cliConfig.name has not been set!');
        }
        this.defaultConfigFilePath = `${os.homedir()}/.${context.cliConfig.name}.yaml`;

        // determine actual config file path
        const configServiceConfig = context.serviceConfigs.get(this.id);
        if (!_.isUndefined(configServiceConfig) && _.isString(configServiceConfig.configFilePath)) {
            this.configurationLocation = configServiceConfig.configFilePath;
        } else {
            this.configurationLocation = this.defaultConfigFilePath;
        }
        this.log(`Using configFilePath: ${this.configurationLocation}`);

        // load config
        const config = this.getConfig();

        // set configs on context
        config.serviceConfigs.forEach((serviceConfig: any, id: string) => {
            context.serviceConfigs.set(id, serviceConfig);
        });
        config.commandConfigs.forEach((commandConfig: CommandArgs, name: string) => {
            context.commandConfigs.set(name, commandConfig);
        });
    }

    /**
     * @inheritdoc
     *
     * Loads the configuration from the current contents of the current [[configurationLocation]] location.
     *
     * @throws *Error* if [[configurationLocation]] is:
     * * a non-default location and it does not exist, cannot be read or cannot be parsed
     * * the default location and it exists and can be read but cannot be parsed
     * * [[configurationLocation]] has not yet been defined (as [[init]] has not yet been invoked)
     */
    public getConfig(): any {
        if (_.isUndefined(this.configurationLocation)) {
            throw new Error('configurationLocation has not been defined, has init() been invoked?');
        }

        const customConfig = this.configurationLocation !== this.defaultConfigFilePath;
        const config = {
            serviceConfigs: new Map<string, any>(),
            commandConfigs: new Map<string, CommandArgs>()
        };

        try {
            fs.accessSync(this.configurationLocation, fs.constants.F_OK);
        } catch (err) {
            if (customConfig) {
                throw new Error(`configFile: ${this.configurationLocation} doesn't exist or not visible!`);
            } else {
                this.log(`configFile: ${this.configurationLocation} doesn't exist or not visible - ignoring`);
                return config;
            }
        }

        try {
            fs.accessSync(this.configurationLocation, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`configFile: ${this.configurationLocation} is not readable!`);
        }

        const stat = fs.statSync(this.configurationLocation);
        if (stat.isDirectory()) {
            throw new Error(`configFile: ${this.configurationLocation} is a directory!`);
        }

        const fileContents = fs.readFileSync(this.configurationLocation, 'utf8');
        try {
            const data = yaml.safeLoad(fileContents);

            if (!_.isUndefined(data.serviceConfigs) && !_.isEmpty(data.serviceConfigs)) {
                Object.keys(data.serviceConfigs).forEach((id) => {
                    config.serviceConfigs.set(id, data.serviceConfigs[id]);
                });
                this.log(`Loaded ${config.serviceConfigs.size} serviceConfig(s)`);
            }
            if (!_.isUndefined(data.commandConfigs) && !_.isEmpty(data.commandConfigs)) {
                Object.keys(data.commandConfigs).forEach((name) => {
                    config.commandConfigs.set(name, data.commandConfigs[name]);
                });
                this.log(`Loaded ${config.commandConfigs.size} commandConfigs(s)`);
            }
        } catch (err) {
            throw new Error(`configFile: ${this.configurationLocation} failed to parse: ${err}`);
        }
        return config;
    }

    /**
     * Saves the configuration to the current [[configurationLocation]] location.
     *
     * @throws *Error* if:
     * * [[configurationLocation]] is a directory or cannot be written to
     * * [[configurationLocation]] has not yet been defined (as [[init]] has not yet been invoked)
     */
    private setConfig(config: any): void {

        const data: any = {
            serviceConfigs: {},
            commandConfigs: {}
        };
        config.serviceConfigs.forEach((serviceConfig: any, id: string) => {
            data.serviceConfigs[id] = serviceConfig;
        });
        config.commandConfigs.forEach((commandConfig: CommandArgs, name: string) => {
            data.commandConfigs[name] = commandConfig;
        });

        // save config
        if (_.isUndefined(this.configurationLocation)) {
            throw new Error('configurationLocation has not been defined, has init() been invoked?');
        }
        try {
            fs.accessSync(this.configurationLocation, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`configFile: ${this.configurationLocation} is not writable!`);
        }
        fs.writeFileSync(this.configurationLocation, yaml.safeDump(data), 'utf8');
    }

    /**
     * @inheritdoc
     *
     * Loads the configuration from the current contents of the current [[configurationLocation]] location.
     *
     * @throws *Error* if [[configurationLocation]] is:
     * * a non-default location and it does not exist, cannot be read or cannot be parsed
     * * the default location and it exists and can be read but cannot be parsed
     */
    public getCommandConfig(name: string): CommandArgs {
        const config = this.getConfig();
        return config.commandConfigs.get(name);
    }

    /**
     * @inheritdoc
     *
     * Loads the configuration from the current contents of the current [[configurationLocation]] location.
     *
     * @throws *Error* if [[configurationLocation]] is:
     * * a non-default location and it does not exist, cannot be read or cannot be parsed
     * * the default location and it exists and can be read but cannot be parsed
     */
    public getServiceConfig(id: string): any {
        const config = this.getConfig();
        return config.serviceConfigs.get(id);
    }

    /**
     * @inheritdoc
     *
     * Saves the configuration to the current [[configurationLocation]] location.
     *
     * @throws *Error* if:
     * * [[configurationLocation]] is a directory or cannot be written to
     * * the existing contents of [[configurationLocation]] cannot be parsed
     */
    public setCommandConfig(name: string, commandArgs: CommandArgs): void {
        const config = this.getConfig();
        config.commandConfigs.set(name, commandArgs);
        this.setConfig(config);
    }

    /**
     * @inheritdoc
     *
     * Saves the configuration to the current [[configurationLocation]] location.
     *
     * @throws *Error* if:
     * * [[configurationLocation]] is a directory or cannot be written to
     * * the existing contents of [[configurationLocation]] cannot be parsed
     */
    public setServiceConfig(id: string, serviceConfig: any): void {
        const config = this.getConfig();
        config.serviceConfigs.set(id, serviceConfig);
        this.setConfig(config);
    }
}
