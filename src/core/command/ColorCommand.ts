// eslint-disable-next-line max-classes-per-file
import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { STDOUT_PRINTER_SERVICE, STDERR_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';

/**
 * @module @flowscripter/cli-framework
 */

/**
 * Abstract base class for color commands.
 */
abstract class BaseColorCommand {

    readonly runPriority: number;

    /**
     * @param runPriority to determine the relative order in which multiple [[GlobalModifierCommand]] instances are run.
     */
    public constructor(runPriority: number) {
        this.runPriority = runPriority;
    }

    /**
     * Expects implementations of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] and
     * [[STDERR_PRINTER_SERVICE]] IDs in the provided [[Context]].
     *
     * @param enabled whether color should be enabled or not
     * @param context the [[Context]] in which to run.
     */
    // eslint-disable-next-line class-methods-use-this
    public async doRun(enabled: boolean, context: Context): Promise<void> {
        const stdoutPrinter = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!stdoutPrinter) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        const stderrPrinter = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (!stderrPrinter) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }

        stdoutPrinter.colorEnabled = enabled;
        stderrPrinter.colorEnabled = enabled;
    }
}

export class ColorCommand extends BaseColorCommand implements GlobalModifierCommand {

    readonly name = 'color';

    readonly description = 'Enable colour output';

    /**
     * @inheritdoc
     *
     * Enables color output. Expects implementations of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] and
     * [[STDERR_PRINTER_SERVICE]] IDs in the provided [[Context]].
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        this.doRun(true, context);
    }
}

export class NoColorCommand extends BaseColorCommand implements GlobalModifierCommand {

    readonly name = 'nocolor';

    readonly description = 'Disable colour output';

    /**
     * @inheritdoc
     *
     * Disables color output.
     */
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        this.doRun(false, context);
    }
}
