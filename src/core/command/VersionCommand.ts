/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import Context from '../../api/Context';
import Printer, { STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalCommand from '../../api/GlobalCommand';
import { CommandArgs } from '../../api/Command';

/**
 * Implementation of [[GlobalCommand]] which outputs the version of the CLI.
 *
 * Expects a version string to be provided.
 */
export default class VersionCommand implements GlobalCommand {

    readonly name = 'version';

    readonly shortAlias = 'v';

    readonly description = 'Show version information';

    /**
     * @inheritdoc
     *
     * Prints the CLI version. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]]
     * ID in the provided [[Context]].
     */
    // eslint-disable-next-line class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!printer) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.version)) {
            throw new Error('Provided context is missing property: "cliConfig.version: string"');
        }
        printer.info(`${context.cliConfig.version}\n`);
    }
}
