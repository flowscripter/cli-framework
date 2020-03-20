/**
 * @module @flowscripter/cli-framework
 */

// eslint-disable-next-line max-classes-per-file
import _ from 'lodash';
import { Writable } from 'stream';
import kleur from 'kleur';
import ora from 'ora';
import Service from '../../api/Service';
import Context from '../../api/Context';

export const STDOUT_PRINTER_SERVICE = '@flowscripter/cli-framework/printer-service#stdout';
export const STDERR_PRINTER_SERVICE = '@flowscripter/cli-framework/printer-service#stderr';

/**
 * Enum of message importance level
 */
export enum Level {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

/**
 * Enum of message icons
 */
export enum Icon {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    ALERT = 'ALERT',
    INFORMATION = 'INFORMATION'
}

/**
 * Interface to be implemented by a [[Service]] allowing a [[Command]] and [[Runner]] to output user messages.
 */
export default interface Printer {

    /**
     * Disable or enable color output for messages
     */
    colorEnabled: boolean;

    /**
     * The Writable used for output. Can be used for directly outputting binary data etc.
     */
    writable: Writable;

    /**
     * Return the provided message so that it appears bold when printed.
     */
    bold(message: string): string;

    /**
     * Print a [[DEBUG]] level message.
     *
     * @param message the message to output
     * @param icon optional icon to display with the message
     */
    debug(message: string, icon?: Icon): void;

    /**
     * Print an [[INFO]] level message.
     *
     * @param message the message to output
     * @param icon optional icon to display with the message
     */
    info(message: string, icon?: Icon): void;

    /**
     * Print a [[WARN]] level message.
     *
     * @param message the message to output
     * @param icon optional icon to display with the message
     */
    warn(message: string, icon?: Icon): void;

    /**
     * Print an [[ERROR]] level message.
     *
     * @param message the message to output
     * @param icon optional icon to display with the message
     */
    error(message: string, icon?: Icon): void;

    /**
     * Display the spinner.
     *
     * This method ignores the current log [[Level]]. If the spinner is already displayed the text will be updated.
     *
     * @param message the message to output after the spinner
     */
    showSpinner(message: string): void;

    /**
     * Hide the spinner.
     *
     * This method ignores the current log [[Level]].
     *
     * NOTE: Any other log method will also clear the spinner.
     */
    hideSpinner(): void;

    /**
     * Set the output level for the printer.
     *
     * Default level is [[INFO]]
     *
     * @param level any message below this level will be filtered from output
     */
    setLevel(level: Level): void;
}

const levels = {
    [Level.DEBUG]: 0,
    [Level.INFO]: 1,
    [Level.WARN]: 2,
    [Level.ERROR]: 3
};

const icons = {
    [Icon.SUCCESS]: kleur.green('✔'),
    [Icon.FAILURE]: kleur.red('ⅹ'),
    [Icon.ALERT]: kleur.yellow('⚠'),
    [Icon.INFORMATION]: kleur.blue('ℹ')
};

/**
 * Abstract implementation of [[Printer]] exposed as a [[Service]].
 */
abstract class PrinterService implements Service, Printer {

    private threshold = levels[Level.INFO];

    private spinner: ora.Ora = ora();

    readonly writable: Writable;

    readonly id: string;

    readonly initPriority: number;

    /**
     * Create a [[Printer]] service using the provided Writable and registering with the provided [[Service]] ID.
     *
     * @param writable the Writable to use for output.
     * @param id the ID to use for service registration.
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    protected constructor(writable: Writable, id: string, initPriority: number) {
        this.writable = writable;
        this.id = id;
        this.initPriority = initPriority;
    }

    private log(level: number, message: string, icon?: Icon): void {
        if (this.spinner.isSpinning) {
            this.hideSpinner();
        }
        if (this.threshold > level) {
            return;
        }
        this.writable.write(`${icon ? `${icons[icon]} ` : ''}${message}`);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    set colorEnabled(enabled: boolean) {
        kleur.enabled = enabled;
        if (enabled) {
            icons[Icon.SUCCESS] = kleur.green('✔');
            icons[Icon.FAILURE] = kleur.red('ⅹ');
            icons[Icon.ALERT] = kleur.yellow('⚠');
            icons[Icon.INFORMATION] = kleur.blue('ℹ');
        } else {
            icons[Icon.SUCCESS] = '✔';
            icons[Icon.FAILURE] = 'ⅹ';
            icons[Icon.ALERT] = '⚠';
            icons[Icon.INFORMATION] = 'ℹ';
        }
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    get colorEnabled(): boolean {
        return kleur.enabled;
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public bold(message: string): string {
        return kleur.bold(message);
    }

    /**
     * @inheritdoc
     */
    public debug(message: string, icon?: Icon): void {
        this.log(levels[Level.DEBUG], kleur.grey(message), icon);
    }

    /**
     * @inheritdoc
     */
    public info(message: string, icon?: Icon): void {
        this.log(levels[Level.INFO], message, icon);
    }

    /**
     * @inheritdoc
     */
    public warn(message: string, icon?: Icon): void {
        this.log(levels[Level.WARN], kleur.yellow(message), icon);
    }

    /**
     * @inheritdoc
     */
    public error(message: string, icon?: Icon): void {
        this.log(levels[Level.ERROR], kleur.red(message), icon);
    }

    /**
     * @inheritdoc
     */
    public showSpinner(message: string): void {
        if (this.spinner.isSpinning) {
            this.spinner.text = message;
        } else {
            this.spinner.start(message);
        }
    }

    /**
     * @inheritdoc
     */
    public hideSpinner(): void {
        if (this.spinner.isSpinning) {
            this.spinner.stop();
        }
    }

    /**
     * @inheritdoc
     */
    public setLevel(level: Level): void {
        this.threshold = levels[level];
    }

    /**
     * @inheritdoc
     *
     * Supported configuration:
     *
     * * *colorEnabled: boolean | string*
     * * *level: Level | string*
     */
    public init(context: Context): void {
        const config = context.serviceConfigs.get(this.id);
        if (_.isEmpty(config)) {
            return;
        }

        if (_.isString(config.colorEnabled)) {
            this.colorEnabled = (config.colorEnabled.toLowerCase() === 'true');
        } else if (_.isBoolean(config.colorEnabled)) {
            this.colorEnabled = config.colorEnabled;
        }

        if (_.isString(config.threshold)) {
            const level = levels[config.threshold.toUpperCase() as Level];
            if (_.isUndefined(level)) {
                this.threshold = level;
            }
        }
    }
}

/**
 * Concrete stdout implementation of [[Printer]] exposed as a [[Service]].
 */
export class StdoutPrinterService extends PrinterService {

    /**
     * Create a [[Printer]] service for stdout
     *
     * @param stdoutWritable the Writable to use for stdout output
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(stdoutWritable: Writable, initPriority: number) {
        super(stdoutWritable, STDOUT_PRINTER_SERVICE, initPriority);
    }
}

/**
 * Concrete stderr implementation of [[Printer]] exposed as a [[Service]].
 */
export class StderrPrinterService extends PrinterService {

    /**
     * Create a [[Printer]] service for stderr
     *
     * @param stderrWritable the Writable to use for stderr output
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(stderrWritable: Writable, initPriority: number) {
        super(stderrWritable, STDERR_PRINTER_SERVICE, initPriority);
    }
}
