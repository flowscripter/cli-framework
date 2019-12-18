import DefaultContext from '../../src/runtime/DefaultContext';

const SERVICE_ID = 'service';

describe('DefaultContext test', () => {

    test('DefaultContext is instantiable', () => {
        expect(new DefaultContext()).toBeInstanceOf(DefaultContext);
    });

    test('Service is registered and available from one factory', () => {
        const context = new DefaultContext();

        expect(context.getService(SERVICE_ID)).toBeNull();

        context.addService({
            id: SERVICE_ID,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
            init: (config?: any): void => {
                // empty
            }
        });

        expect(context.getService(SERVICE_ID)).not.toBeNull();
    });

    test('Cannot add duplicate service', () => {
        const context = new DefaultContext();

        context.addService({
            id: SERVICE_ID,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
            init: (config?: any): void => {
                // empty
            }
        });

        expect(() => context.addService({
            id: SERVICE_ID,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
            init: (config?: any): void => {
                // empty
            }
        })).toThrow();
    });
});
