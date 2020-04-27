import _ from 'lodash';
import path from 'path';
import os from 'os';
import GroupCommand from '../../api/GroupCommand';
import SubCommand from '../../api/SubCommand';
import { AddCommand, RemoveCommand } from './AddRemoveCommand';
import Context from '../../api/Context';
import { CommandArgs } from '../..';

/**
 * @module @flowscripter/cli-framework
 */
export default class PluginCommand implements GroupCommand {

    public readonly name = 'plugin';

    public readonly description = 'Plugin management commands';

    readonly memberSubCommands: ReadonlyArray<SubCommand> = [
        new AddCommand(),
        new RemoveCommand()
    ];

    /**
     * @inheritDoc
     *
     * The following config properties are supported in the provided [[Context]] at
     * `context.commandConfigs[<this.name>]`:
     *
     * * `remoteModuleRegistry`: plugin module remote registry location string. If not provided, the default is
     * `https://registry.npmjs.org/`
     * * `localModuleCacheLocation`: plugin module local cache location string. If not provided, the default is
     * `os.homedir() + "/.npm"`
     * * `modulePrefix`: a prefix string for plugin modules e.g. if a prefix of `@foo` is configured and a module
     * name `bar` is specified in an *install* or *uninstall* request then the module name used will be `@foo/bar`.
     *
     * These properties will be set as config properties on member commands.
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {

        let remoteModuleRegistry = 'https://registry.npmjs.org/';
        let localModuleCacheLocation = path.join(os.homedir(), '.npm');
        let modulePrefix = '';

        const config = context.commandConfigs.get(this.name);
        if (!_.isUndefined(config)) {
            if (!_.isUndefined(config.remoteModuleRegistry)) {
                if (!_.isString(config.remoteModuleRegistry)) {
                    throw new Error('The configured "remoteModuleRegistry" is not a string!');
                }
                remoteModuleRegistry = config.remoteModuleRegistry;
            }

            if (!_.isUndefined(config.localModuleCacheLocation)) {
                if (!_.isString(config.localModuleCacheLocation)) {
                    throw new Error('The configured "localModuleCacheLocation" is not a string!');
                }
                localModuleCacheLocation = config.localModuleCacheLocation;
            }

            if (!_.isUndefined(config.modulePrefix)) {
                if (!_.isString(config.modulePrefix)) {
                    throw new Error('The configured "modulePrefix" is not a string!');
                }
                modulePrefix = config.modulePrefix;
            }
        }

        let addConfig = context.commandConfigs.get(AddCommand.name);
        if (_.isUndefined(addConfig)) {
            addConfig = {};
            context.commandConfigs.set(AddCommand.name, addConfig);
        }
        let removeConfig = context.commandConfigs.get(RemoveCommand.name);
        if (_.isUndefined(removeConfig)) {
            removeConfig = {};
            context.commandConfigs.set(RemoveCommand.name, removeConfig);
        }
        if (_.isUndefined(addConfig.remoteModuleRegistry)) {
            addConfig.remoteModuleRegistry = remoteModuleRegistry;
        }
        if (_.isUndefined(addConfig.localModuleCacheLocation)) {
            addConfig.localModuleCacheLocation = localModuleCacheLocation;
        }
        if (_.isUndefined(addConfig.modulePrefix)) {
            addConfig.modulePrefix = modulePrefix;
        }
        if (_.isUndefined(removeConfig.remoteModuleRegistry)) {
            removeConfig.remoteModuleRegistry = remoteModuleRegistry;
        }
        if (_.isUndefined(removeConfig.localModuleCacheLocation)) {
            removeConfig.localModuleCacheLocation = localModuleCacheLocation;
        }
        if (_.isUndefined(removeConfig.modulePrefix)) {
            removeConfig.modulePrefix = modulePrefix;
        }
    }
}
