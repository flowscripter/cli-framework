import DefaultServiceRegistry from '../../src/runtime/DefaultServiceRegistry';
import Service from '../../src/api/Service';

const SERVICE_ID = 'service';

describe('DefaultServiceRegistry test', () => {

    test('DefaultServiceRegistry is instantiable', () => {
        expect(new DefaultServiceRegistry()).toBeInstanceOf(DefaultServiceRegistry);
    });

    test('Service is registered and available from one factory', () => {
        const serviceRegistry = new DefaultServiceRegistry();

        expect(serviceRegistry.getServiceById(SERVICE_ID)).toBeUndefined();

        const service: Service = {
            id: SERVICE_ID,
            initPriority: 100,
            init: (): void => {
                // empty
            }
        };

        serviceRegistry.addService(service);
        expect(serviceRegistry.getServiceById(SERVICE_ID)).toBeDefined();
    });

    test('Cannot add duplicate service', () => {
        const serviceRegistry = new DefaultServiceRegistry();

        const services: Service[] = [
            {
                id: SERVICE_ID,
                initPriority: 100,
                init: (): void => {
                    // empty
                }
            }, {
                id: SERVICE_ID,
                initPriority: 110,
                init: (): void => {
                    // empty
                }
            }];
        serviceRegistry.addService(services[0]);
        expect(() => serviceRegistry.addService(services[1])).toThrow();
    });
});
