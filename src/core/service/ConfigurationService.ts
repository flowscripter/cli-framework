/**
 * @module @flowscripter/cli-framework
 */

import Service from '../../api/Service';

export const CONFIGURATION_SERVICE = '@flowscripter/cli-framework/configuration-service';

// TODO: implement
/**
 * Interface to be implemented by a [[Service]] allowing [[Command]] and [[Service]] instances to manage configuration.
 *
 * The configuration accessed may correspond to defined [[Command]] [[Argument]] definitions or it may be [[Service]]
 * or [[Command]] configuration values not exposed to the user via the command line.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface Configuration {
}

/**
 * Core implementation of [[Configuration]] exposed as a [[Service]].
 */
export class ConfigurationService implements Service, Configuration {

    readonly id = CONFIGURATION_SERVICE;

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
