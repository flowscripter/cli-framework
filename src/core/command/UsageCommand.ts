/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalCommand from '../../api/GlobalCommand';

export default class UsageCommand implements GlobalCommand {

    readonly name = 'usage';

    readonly description = 'Show usage information';

    readonly helpCommand: GlobalCommand;

    readonly printCliDescription: boolean;

    /**
     * @param helpCommand the [[GlobalCommand]] to use as an example of invoking help when outputting usage information
     * @param printCliDescription whether or not to output the CLI description when invoked
     */
    public constructor(helpCommand: GlobalCommand, printCliDescription = true) {
        this.helpCommand = helpCommand;
        this.printCliDescription = printCliDescription;
    }

    /**
     * @inheritdoc
     *
     * Prints CLI usage. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] ID
     * in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {

        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.name)) {
            throw new Error('Provided context is missing property: "cliConfig.name: string"');
        }
        if (_.isUndefined(context.cliConfig) || !_.isString(context.cliConfig.description)) {
            throw new Error('Provided context is missing property: "cliConfig.description: string"');
        }

        const printer = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!printer) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        if (this.printCliDescription) {
            printer.info(`\n${printer.blue(context.cliConfig.description)}\n\n`);
        }
        printer.info(`${printer.dim('Try running:')}\n\n  ${context.cliConfig.name} --${this.helpCommand.name}\n\n`);
    }
}
