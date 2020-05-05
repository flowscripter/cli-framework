import _ from 'lodash';
import GroupCommand from '../../api/GroupCommand';
import SubCommand from '../../api/SubCommand';
import { ADD_COMMAND_NAME, REMOVE_COMMAND_NAME, AddCommand, RemoveCommand } from './AddRemoveCommand';
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
     * The following config property is supported in the provided [[Context]] at
     * `context.commandConfigs[<this.name>]`:
     *
     * * `remoteModuleRegistry`: plugin module remote registry location string. If not provided, the default is
     * `https://registry.npmjs.org/`
     *
     * This property will be set as a config property on member commands.
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {

        let remoteModuleRegistry = 'https://registry.npmjs.org/';

        const config = context.commandConfigs.get(this.name);
        if (!_.isUndefined(config)) {
            if (!_.isUndefined(config.remoteModuleRegistry)) {
                if (!_.isString(config.remoteModuleRegistry)) {
                    throw new Error('The configured "remoteModuleRegistry" is not a string!');
                }
                remoteModuleRegistry = config.remoteModuleRegistry;
            }
        }

        let addConfig = context.commandConfigs.get(ADD_COMMAND_NAME);
        if (_.isUndefined(addConfig)) {
            addConfig = {};
            context.commandConfigs.set(ADD_COMMAND_NAME, addConfig);
        }
        let removeConfig = context.commandConfigs.get(REMOVE_COMMAND_NAME);
        if (_.isUndefined(removeConfig)) {
            removeConfig = {};
            context.commandConfigs.set(REMOVE_COMMAND_NAME, removeConfig);
        }
        if (_.isUndefined(addConfig.remoteModuleRegistry)) {
            addConfig.remoteModuleRegistry = remoteModuleRegistry;
        }
        if (_.isUndefined(removeConfig.remoteModuleRegistry)) {
            removeConfig.remoteModuleRegistry = remoteModuleRegistry;
        }
    }
}
