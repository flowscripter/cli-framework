/**
 * @module @flowscripter/cli-framework
 */

import _ from 'lodash';
import { Writable } from 'stream';
import chalk from 'chalk';
import ora from 'ora';
import Service from '../../api/Service';

export const PRINTER_SERVICE = '@flowscripter/cli-framework/printer-service';

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

const green = chalk.keyword('green');
const grey = chalk.keyword('grey');
const blue = chalk.keyword('blue');
const orange = chalk.keyword('orange');
const red = chalk.keyword('red');

const levels = {
    [Level.DEBUG]: 0,
    [Level.INFO]: 1,
    [Level.WARN]: 2,
    [Level.ERROR]: 3
};

const icons = {
    [Icon.SUCCESS]: green('✔'),
    [Icon.FAILURE]: red('ⅹ'),
    [Icon.ALERT]: orange('⚠'),
    [Icon.INFORMATION]: blue('ℹ')
};

/**
 * Core implementation of [[Printer]] exposed as a [[Service]].
 */
export class PrinterService implements Service, Printer {

    readonly id = PRINTER_SERVICE;

    private threshold = levels[Level.INFO];

    private spinner: ora.Ora = ora();

    private readonly writable: Writable;

    public constructor(writable: Writable) {
        this.writable = writable;
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
        if (enabled) {
            chalk.level = chalk.Level.Ansi256;
        } else {
            chalk.level = chalk.Level.None;
        }
    }

    /**
     * @inheritdoc
     */
    public debug(message: string, icon?: Icon): void {
        this.log(levels[Level.DEBUG], grey(message), icon);
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
        this.log(levels[Level.WARN], orange(message), icon);
    }

    /**
     * @inheritdoc
     */
    public error(message: string, icon?: Icon): void {
        this.log(levels[Level.ERROR], red(message), icon);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public init(config?: any): void {
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
