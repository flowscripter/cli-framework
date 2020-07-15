/**
 * @module @flowscripter/cli-framework-api
 */

import { Writable, Readable } from 'stream';

/**
 * Interface specifying common configuration for a CLI application.
 */
export default interface CLIConfig {

    /**
     * Name of the application.
     */
    readonly name: string;

    /**
     * Description of the application.
     */
    readonly description: string;

    /**
     * Version of the application.
     */
    readonly version: string;

    /**
     * Readable to use for stdin.
     */
    readonly stdin: Readable;

    /**
     * Writable to use for stdout.
     */
    readonly stdout: Writable;

    /**
     * Writable to use for stderr.
     */
    readonly stderr: Writable;
}
