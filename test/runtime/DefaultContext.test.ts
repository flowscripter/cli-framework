import DefaultContext from '../../src/runtime/DefaultContext';
import Service from '../../src/api/Service';
import { CommandArgs } from '../../src';

const SERVICE_ID = 'service';

describe('DefaultContext test', () => {

    test('DefaultContext is instantiable', () => {
        expect(new DefaultContext({}, [], [], new Map(), new Map())).toBeInstanceOf(DefaultContext);
    });

    test('CLI config is populated', () => {
        const context = new DefaultContext({ name: 'foo' }, [], [], new Map(), new Map());

        expect(context.cliConfig.name).toEqual('foo');
    });

    test('Service is registered and available from one factory', () => {
        let context = new DefaultContext({}, [], [], new Map(), new Map());
        expect(context.getService(SERVICE_ID)).toBeNull();

        const services: Service[] = [
            {
                id: SERVICE_ID,
                initPriority: 100,
                init: (): void => {
                    // empty
                }
            }];

        context = new DefaultContext({}, services, [], new Map(), new Map());
        expect(context.getService(SERVICE_ID)).not.toBeNull();
    });

    test('Cannot add duplicate service', () => {

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

        expect(() => new DefaultContext({}, services, [], new Map(), new Map())).toThrow();
    });

    test('Service configs is populated', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();

        serviceConfigs.set('foo', 'bar');

        const context = new DefaultContext({}, [], [], serviceConfigs, new Map());

        expect(context.serviceConfigs.get('foo')).toEqual('bar');
    });

    test('Command configs is populated', () => {
        const commandConfigs = new Map<string, CommandArgs>();

        commandConfigs.set('foo', { bar: 1 });

        const context = new DefaultContext({}, [], [], new Map(), commandConfigs);

        const config = context.commandConfigs.get('foo');
        expect(config).toBeDefined();
        if (config) {
            expect(config.bar).toEqual(1);
        }
    });
});
