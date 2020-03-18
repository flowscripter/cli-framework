import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { Icon, STDOUT_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalCommand from '../../api/GlobalCommand';

/**
 * @module @flowscripter/cli-framework
 */
export default class UsageCommand implements GlobalCommand {

    readonly name = 'usage';

    readonly description = 'Show usage information';

    readonly cliName: string;

    readonly cliDescription: string;

    readonly helpCommand: GlobalCommand;

    /**
     * @param cliName the name of the application to output as part of usage information
     * @param cliDescription the description of the application to output as part of usage information
     * @param helpCommand the [[GlobalCommand]] to use as an example of invoking help when outputting usage information
     */
    public constructor(cliName: string, cliDescription: string, helpCommand: GlobalCommand) {
        this.cliName = cliName;
        this.cliDescription = cliDescription;
        this.helpCommand = helpCommand;
    }

    /**
     * @inheritdoc
     *
     * Prints CLI usage. Expects an implementation of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] ID
     * in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const printer = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (printer == null) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        printer.info(this.cliDescription);
        printer.info('\n');
        printer.info(`try running: \`${this.cliName} --${this.helpCommand.name}\n`, Icon.INFORMATION);
    }
}
