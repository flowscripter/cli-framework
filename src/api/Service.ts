/**
 * @module @flowscripter/cli-framework
 */

/**
 * Interface to be implemented by a [[Service]] implementation.
 *
 * @typeparam S_ID is the type of the Service IDs used by the [[CLI]] instance.
 */
export default interface Service<S_ID> {

    /**
     * The implemented Service ID
     */
    readonly serviceId: S_ID;
}
