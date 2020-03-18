import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { STDOUT_PRINTER_SERVICE, STDERR_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';
import { ArgumentValueTypeName } from '../../api/ArgumentValueType';

/**
 * @module @flowscripter/cli-framework
 */
export default class NoColorCommand implements GlobalModifierCommand {

    readonly name = 'nocolor';

    readonly description = 'Disable colour output';

    readonly runPriority: number;

    /**
     * @param runPriority to determine the relative order in which multiple [[GlobalModifierCommand]] instances are run.
     */
    public constructor(runPriority: number) {
        this.runPriority = runPriority;
    }

    readonly argument: GlobalCommandArgument = {
        name: 'value',
        type: ArgumentValueTypeName.Boolean,
        defaultValue: false
    };

    /**
     * @inheritdoc
     *
     * Disables color output. Expects implementations of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] and
     * [[STDERR_PRINTER_SERVICE]] IDs in the provided [[Context]].
     */
    // eslint-disable-next-line class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const stdoutPrinter = context.getService(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (stdoutPrinter == null) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        const stderrPrinter = context.getService(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (stderrPrinter == null) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        stdoutPrinter.colorEnabled = !commandArgs.value;
        stderrPrinter.colorEnabled = !commandArgs.value;
    }
}
