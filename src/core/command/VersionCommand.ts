import Context from '../../api/Context';
import Printer, { STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalCommand from '../../api/GlobalCommand';
import { CommandArgs } from '../../api/Command';

/**
 * @module @flowscripter/cli-framework
 */

/**
 * Implementation of [[GlobalCommand]] which outputs the version of the CLI.
 *
 * Expects a version string to be provided.
 */
export default class VersionCommand implements GlobalCommand {

    readonly name = 'version';

    readonly shortAlias = 'v';

    readonly description = 'Show version information';

    readonly version: string;

    /**
     * @param version the version to display
     */
    public constructor(version: string) {
        this.version = version;
    }

    /**
     * @inheritdoc
     *
     * Prints the CLI version. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]]
     * ID in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const printer = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        printer.info(this.version);
    }
}
