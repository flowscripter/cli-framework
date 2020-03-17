import * as fs from 'fs';
import _ from 'lodash';
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';
import Configuration, { CONFIGURATION_SERVICE } from '../service/ConfigurationService';
import Printer, { Icon, STDERR_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';

/**
 * @module @flowscripter/cli-framework
 */
export default class ConfigCommand implements GlobalModifierCommand {

    readonly name = 'config';

    readonly description = 'Set the configuration file location';

    readonly runPriority: number;

    /**
     * @param runPriority to determine the relative order in which multiple [[GlobalModifierCommand]] instances are run.
     */
    public constructor(runPriority: number) {
        this.runPriority = runPriority;
    }

    readonly argument: GlobalCommandArgument = {
        name: 'location'
    };

    /**
     * @inheritdoc
     *
     * Sets the configuration file location on the configuration service. This is done by updating the config in the
     * context for the [[Configuration]] service and then invoking [[Configuration.getConfig]]. The return config
     * is then used to update the [[Context]].
     *
     * Expects implementation of a [[Printer]] service registered with the [[STDERR_PRINTER_SERVICE]] ID in the
     * provided [[Context]].
     */
    // eslint-disable-next-line class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const printer = context.getService(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        const configLocation = commandArgs.config as string;

        printer.debug(`configLocation: ${configLocation}`);

        try {
            fs.accessSync(configLocation, fs.constants.F_OK);
        } catch (err) {
            const message = `configuration location doesn't exist or not visible:  ${configLocation}`;
            printer.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        try {
            fs.accessSync(configLocation, fs.constants.R_OK);
        } catch (err) {
            const message = `configuration location is not readable:  ${configLocation}`;
            printer.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        const stat = fs.statSync(configLocation);
        if (stat.isDirectory()) {
            const message = `configuration location is a directory:  ${configLocation}`;
            printer.error(message, Icon.FAILURE);
            throw new Error(message);
        }

        // set the new location for the configuration service
        const configuration = context.getService(CONFIGURATION_SERVICE) as unknown as Configuration;
        if (configuration == null) {
            throw new Error('CONFIGURATION_SERVICE not available in context');
        }
        configuration.configurationLocation = configLocation;

        // load the config from the new location
        const config = configuration.getConfig();

        // set configs on context
        if (!_.isEmpty(context.serviceConfigs)) {
            printer.debug(`${context.serviceConfigs.size} existing serviceConfig(s) are being replaced in context`);
            context.serviceConfigs.clear();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.serviceConfigs.forEach((serviceConfig: any, id: string) => {
            context.serviceConfigs.set(id, serviceConfig);
        });
        if (!_.isEmpty(context.commandConfigs)) {
            printer.debug(`${context.commandConfigs.size} existing commandConfig(s) are being replaced in context`);
            context.commandConfigs.clear();
        }
        config.commandConfigs.forEach((commandConfig: CommandArgs, name: string) => {
            context.commandConfigs.set(name, commandConfig);
        });
    }
}
