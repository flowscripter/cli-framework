/**
 * @module @flowscripter/cli-framework
 */

/**
 * Interface to be implemented by a [[Service]] implementation.
 */
export default interface Service {

    /**
     * The implemented Service ID
     */
    readonly id: string;
}
