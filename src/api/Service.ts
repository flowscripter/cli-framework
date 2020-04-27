/**
 * @module @flowscripter/cli-framework-api
 */

import Context from './Context';

/**
 * Interface to be implemented by a [[Service]] implementation.
 */
export default interface Service {

    /**
     * The implemented Service ID.
     */
    readonly id: string;

    /**
     * Used to determine the order in which multiple [[Service]] instances will be initialised. Higher values
     * will run before lower values.
     */
    readonly initPriority: number;

    /**
     * Initialise the service.
     *
     * @param context the [[Context]] in which to initialise. Note that other services should not be accessed
     * from the provided [[Context]] as they may not yet be initialised.
     */
    init(context: Context): Promise<void>;
}
