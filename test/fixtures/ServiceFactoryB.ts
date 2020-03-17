import ServiceFactory from '../../src/api/ServiceFactory';
import Service from '../../src/api/Service';
import Context from '../../src/api/Context';

export const SERVICE_ID_B = 'service_b';

export default class ServiceFactoryB implements ServiceFactory {

    // eslint-disable-next-line class-methods-use-this
    public getServices(): Iterable<Service> {
        return [{
            id: SERVICE_ID_B,
            initPriority: 100,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            init: (context: Context): void => {
                // empty
            }
        }];
    }
}
