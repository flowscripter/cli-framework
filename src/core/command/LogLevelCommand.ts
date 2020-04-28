import { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';
import Printer, { Level, STDOUT_PRINTER_SERVICE, STDERR_PRINTER_SERVICE } from '../service/PrinterService';
import GlobalModifierCommand from '../../api/GlobalModifierCommand';
import GlobalCommandArgument from '../../api/GlobalCommandArgument';

/**
 * @module @flowscripter/cli-framework
 */
export default class LogLevelCommand implements GlobalModifierCommand {

    readonly name = 'loglevel';

    readonly description = 'Set the logging threshold';

    readonly runPriority: number;

    /**
     * @param runPriority to determine the relative order in which multiple [[GlobalModifierCommand]] instances are run.
     */
    public constructor(runPriority: number) {
        this.runPriority = runPriority;
    }

    readonly argument: GlobalCommandArgument = {
        name: 'level',
        validValues: [
            Level.DEBUG,
            Level.INFO,
            Level.WARN,
            Level.ERROR
        ],
        defaultValue: Level.INFO
    };

    private static getLevel(loglevel: string): Level {
        // eslint-disable-next-line default-case
        switch (loglevel) {
        case Level.DEBUG as string:
            return Level.DEBUG;
        case Level.INFO as string:
            return Level.INFO;
        case Level.WARN as string:
            return Level.WARN;
        case Level.ERROR as string:
            return Level.ERROR;
        default:
            throw new Error(`Logic error, unsupported loglevel: ${loglevel}`);
        }
    }

    /**
     * @inheritdoc
     *
     * Sets the log level. Expects implementations of [[Printer]] registered with the [[STDOUT_PRINTER_SERVICE]] and
     * [[STDERR_PRINTER_SERVICE]] IDs in the provided [[Context]].
     */
    // eslint-disable-next-line class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
        const stdoutPrinter = context.serviceRegistry.getServiceById(STDOUT_PRINTER_SERVICE) as unknown as Printer;
        if (!stdoutPrinter) {
            throw new Error('STDOUT_PRINTER_SERVICE not available in context');
        }
        const stderrPrinter = context.serviceRegistry.getServiceById(STDERR_PRINTER_SERVICE) as unknown as Printer;
        if (!stderrPrinter) {
            throw new Error('STDERR_PRINTER_SERVICE not available in context');
        }
        stdoutPrinter.setLevel(LogLevelCommand.getLevel(commandArgs.loglevel as string));
        stderrPrinter.setLevel(LogLevelCommand.getLevel(commandArgs.loglevel as string));
    }
}
