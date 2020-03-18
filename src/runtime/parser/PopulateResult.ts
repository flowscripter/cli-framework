/**
 * @module @flowscripter/cli-framework
 */

import { CommandArgs } from '../..';

/**
 * A container holding the result of arguments population.
 */
export interface PopulateResult {

    /**
     * Populated arguments
     */
    commandArgs: CommandArgs;

    /**
     * Any arguments which were unused during arguments population.
     */
    unusedArgs: string[];
}
