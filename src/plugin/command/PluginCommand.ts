import _ from 'lodash';
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
        if (_.isUndefined(removeConfig.remoteModuleRegistry)) {
            removeConfig.remoteModuleRegistry = remoteModuleRegistry;
        }
    }
}
