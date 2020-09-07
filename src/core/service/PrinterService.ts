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
     * The Writable used for output. Can be used for direct output of binary data etc.
     */
    writable: Writable | undefined;

    /**
     * Return the provided message so that it appears dim when printed.
     */
    dim(message: string): string;

    /**
     * Return the provided message so that it appears red when printed.
     */
    red(message: string): string;

    /**
     * Return the provided message so that it appears yellow when printed.
     */
    yellow(message: string): string;

    /**
     * Return the provided message so that it appears green when printed.
     */
    green(message: string): string;

    /**
     * Return the provided message so that it appears blue when printed.
     */
    blue(message: string): string;

    /**
     * Return the provided message so that it appears gray when printed.
     */
    gray(message: string): string;

    /**
     * Return the provided message so that it appears cyan when printed.
     */
    cyan(message: string): string;

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
    [Icon.FAILURE]: kleur.red('✖'),
    [Icon.ALERT]: kleur.yellow('‼'),
    [Icon.INFORMATION]: kleur.blue('ℹ')
};

/**
 * Abstract implementation of [[Printer]] exposed as a [[Service]].
 */
abstract class PrinterService implements Service, Printer {

    private threshold = levels[Level.INFO];

    private spinner: ora.Ora = ora();

    protected readonlyWritable: Writable | undefined;

    get writable(): Writable {
        if (_.isUndefined(this.readonlyWritable)) {
            throw new Error('writable is undefined, has init() been called?"');
        }
        return this.readonlyWritable;
    }

    readonly id: string;

    readonly initPriority: number;

    /**
     * Create a [[Printer]] service registering with the provided [[Service]] ID.
     *
     * @param id the ID to use for service registration.
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    protected constructor(id: string, initPriority: number) {
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
        if (this.writable) {
            this.writable.write(`${icon ? `${icons[icon]} ` : ''}${message}`);
        }
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    set colorEnabled(enabled: boolean) {
        kleur.enabled = enabled;
        if (enabled) {
            icons[Icon.SUCCESS] = kleur.green('✔');
            icons[Icon.FAILURE] = kleur.red('✖');
            icons[Icon.ALERT] = kleur.yellow('‼');
            icons[Icon.INFORMATION] = kleur.blue('ℹ');
        } else {
            icons[Icon.SUCCESS] = '✔';
            icons[Icon.FAILURE] = '✖';
            icons[Icon.ALERT] = '‼';
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
    public dim(message: string): string {
        return kleur.dim(message);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public green(message: string): string {
        return kleur.green(message);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public red(message: string): string {
        return kleur.red(message);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public blue(message: string): string {
        return kleur.blue(message);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public yellow(message: string): string {
        return kleur.yellow(message);
    }
    /**
     * @inheritdoc
     */

    // eslint-disable-next-line class-methods-use-this
    public cyan(message: string): string {
        return kleur.cyan(message);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line class-methods-use-this
    public gray(message: string): string {
        return kleur.gray(message);
    }

    /**
     * @inheritdoc
     */
    public debug(message: string, icon?: Icon): void {
        this.log(levels[Level.DEBUG], message, icon);
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
        this.log(levels[Level.WARN], message, icon);
    }

    /**
     * @inheritdoc
     */
    public error(message: string, icon?: Icon): void {
        this.log(levels[Level.ERROR], message, icon);
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
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(initPriority: number) {
        super(STDOUT_PRINTER_SERVICE, initPriority);
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if provided [[Context]] does not include:
     *
     * * `cliConfig.stdout: Writable`
     */
    public init(context: Context): void {
        super.init(context);
        if (_.isUndefined(context.cliConfig.stdout) || !_.isFunction(context.cliConfig.stdout.write)) {
            throw new Error('Provided context is missing property: "cliConfig.stdout: Writable"');
        }
        this.readonlyWritable = context.cliConfig.stdout;
    }
}

/**
 * Concrete stderr implementation of [[Printer]] exposed as a [[Service]].
 */
export class StderrPrinterService extends PrinterService {

    /**
     * Create a [[Printer]] service for stderr
     *
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(initPriority: number) {
        super(STDERR_PRINTER_SERVICE, initPriority);
    }

    /**
     * @inheritdoc
     *
     * @throws *Error* if provided [[Context]] does not include:
     *
     * * `cliConfig.stderr: Writable`
     */
    public init(context: Context): void {
        super.init(context);
        if (_.isUndefined(context.cliConfig.stderr) || !_.isFunction(context.cliConfig.stderr.write)) {
            throw new Error('Provided context is missing property: "cliConfig.stderr: Writable"');
        }
        this.readonlyWritable = context.cliConfig.stderr;
    }
}
