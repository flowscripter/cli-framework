/**
 * @module @flowscripter/cli-framework
 */

import { Readable, Writable } from 'stream';
import prompts from 'prompts';
import Service from '../../api/Service';

export const PROMPTER_SERVICE = '@flowscripter/cli-framework/prompter-service';

/**
 * Interface to be implemented by a [[Service]] allowing a [[Command]] to prompt the user for further input while
 * it is running.
 */
export default interface Prompter {

    /**
     * Prompt the user to enter a boolean value.
     *
     * @param message the prompt for the user.
     * @return the boolean value entered by the user.
     */
    booleanPrompt(message: string): Promise<boolean>;

    /**
     * Prompt the user to enter a number value.
     *
     * @param message the prompt for the user.
     * @param isFloat whether to allow floating point numbers. Defaults to *false*.
     * @param fractionalDigits the number of fractional digits to round floating point numbers to. Defaults to *2*.
     * @return the number value entered by the user.
     */
    numberPrompt(message: string, isFloat?: boolean, fractionalDigits?: number): Promise<number>;

    /**
     * Prompt the user to enter a string value.
     *
     * @param message the prompt for the user.
     * @return the string value entered by the user.
     */
    stringPrompt(message: string): Promise<string>;

    /**
     * Prompt the user to enter a password value.
     *
     * @param message the prompt for the user.
     * @return the string value entered by the user.
     */
    passwordPrompt(message: string): Promise<string>;

    /**
     * Prompt the user to select a single item from a list.
     *
     * @param message the prompt for the user.
     * @param choices the list of items to select from (comprising of a displayed *title* and returned *value*)
     * @typeparam T is the type of the item values, one of which is returned as the selected item value.
     * @return the value of the item selected by the user.
     */
    selectPrompt<T>(message: string, choices: {
        title: string;
        value: T;
    }[]): Promise<T>;
}

/**
 * Core implementation of [[Prompter]] exposed as a [[Service]].
 */
export class PrompterService implements Service, Prompter {

    readonly id = PROMPTER_SERVICE;

    readonly initPriority: number;

    readonly readable: Readable;

    readonly writable: Writable;

    /**
     * Create a [[Prompter]] service using the provided Readable and Writable.
     *
     * @param readable the Readable to use for input.
     * @param writable the Writable to use for output.
     * @param initPriority to determine the relative order in which multiple [[Service]] instances are initialised.
     */
    public constructor(readable: Readable, writable: Writable, initPriority: number) {
        this.readable = readable;
        this.writable = writable;
        this.initPriority = initPriority;
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function,class-methods-use-this
    public init(config?: any): void { }

    /**
     * @inheritdoc
     */
    public async booleanPrompt(message: string): Promise<boolean> {
        const name = 'confirm';
        const response = await prompts({
            type: name,
            name,
            message,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stdin: this.readable,
            stdout: this.writable
        });
        return response[name];
    }

    /**
     * @inheritdoc
     */
    public async numberPrompt(message: string, isFloat = false, fractionalDigits = 2): Promise<number> {
        const name = 'number';
        const response = await prompts({
            type: name,
            name,
            message,
            float: isFloat,
            round: fractionalDigits,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stdin: this.readable,
            stdout: this.writable
        });
        return response[name];
    }

    /**
     * @inheritdoc
     */
    public async stringPrompt(message: string): Promise<string> {
        const name = 'text';
        const response = await prompts({
            type: name,
            name,
            message,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stdin: this.readable,
            stdout: this.writable
        });
        return response[name];
    }

    /**
     * @inheritdoc
     */
    public async passwordPrompt(message: string): Promise<string> {
        const name = 'password';
        const response = await prompts({
            type: name,
            name,
            message,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stdin: this.readable,
            stdout: this.writable
        });
        return response[name];
    }

    /**
     * @inheritdoc
     */
    public async selectPrompt<T>(message: string, choices: {
        title: string;
        value: T;
    }[]): Promise<T> {
        const name = 'select';
        const response = await prompts({
            type: name,
            name,
            message,
            choices,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stdin: this.readable,
            stdout: this.writable
        });
        return response[name];
    }
}
