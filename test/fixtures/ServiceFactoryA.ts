import ServiceFactory from '../../src/api/ServiceFactory';
import Service from '../../src/api/Service';

export const SERVICE_ID_A = 'service_a';

export default class ServiceFactoryA implements ServiceFactory<string> {

    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service<string>> {
        return [{
            serviceId: SERVICE_ID_A
        }];
    }
}
