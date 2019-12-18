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

    /**
     * Initialise the service
     *
     * @param config optional configuration for the service
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(config?: any): void;
}
