import ServiceFactory from '../../src/api/ServiceFactory';
import Service from '../../src/api/Service';

export const SERVICE_ID_A = 'service_a';

export default class ServiceFactoryA implements ServiceFactory {

    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [{
            id: SERVICE_ID_A,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
            init: (config?: any): void => {
                // empty
            }
        }];
    }
}
