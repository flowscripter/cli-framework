/**
 * @module @flowscripter/cli-framework
 */

import Service from '../../api/Service';

export const PROMPTER_SERVICE = '@flowscripter/cli-framework/prompter-service';

// TODO: implement
/**
 * Interface to be implemented by a [[Service]] allowing a [[Command]] to prompt the user for further input while
 * it is running.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface Prompter {
}

/**
 * Core implementation of [[Prompter]] exposed as a [[Service]].
 */
export class PrompterService implements Service, Prompter {

    readonly id = PROMPTER_SERVICE;

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars,class-methods-use-this
    public init(config?: any): void {
        // if (_.isEmpty(config)) {
        //     return;
        // }
    }
}
