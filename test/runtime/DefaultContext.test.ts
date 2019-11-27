import DefaultContext from '../../src/runtime/DefaultContext';
import ServiceFactoryA, { SERVICE_ID_A } from '../fixtures/ServiceFactoryA';
import ServiceFactoryB, { SERVICE_ID_B } from '../fixtures/ServiceFactoryB';

describe('DefaultContext test', () => {

    test('DefaultContext is instantiable', () => {
        expect(new DefaultContext<string>()).toBeInstanceOf(DefaultContext);
    });

    test('Service is registered and available from one factory', () => {
        const context = new DefaultContext<string>();

        expect(context.getService(SERVICE_ID_A)).toBeNull();

        context.addServiceFactory(new ServiceFactoryA());

        expect(context.getService(SERVICE_ID_A)).not.toBeNull();
    });

    test('Service is found in second factory', () => {
        const context = new DefaultContext<string>();

        expect(context.getService(SERVICE_ID_B)).toBeNull();

        context.addServiceFactory(new ServiceFactoryA());

        expect(context.getService(SERVICE_ID_B)).toBeNull();

        context.addServiceFactory(new ServiceFactoryB());

        expect(context.getService(SERVICE_ID_B)).not.toBeNull();
        expect(context.getService(SERVICE_ID_A)).not.toBeNull();
    });
});
