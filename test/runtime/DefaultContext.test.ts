import DefaultContext from '../../src/runtime/DefaultContext';
import { CommandArgs } from '../../src/api/Command';
import DefaultCommandRegistry from '../../src/runtime/DefaultCommandRegistry';
import DefaultServiceRegistry from '../../src/runtime/DefaultServiceRegistry';
import { getCliConfig } from '../fixtures/CLIConfig';

describe('DefaultContext test', () => {

    test('DefaultContext is instantiable', () => {
        expect(new DefaultContext(getCliConfig(), new DefaultServiceRegistry(), new DefaultCommandRegistry(),
            new Map(), new Map())).toBeInstanceOf(DefaultContext);
    });

    test('CLI config is populated', () => {
        const context = new DefaultContext(getCliConfig(), new DefaultServiceRegistry(),
            new DefaultCommandRegistry(), new Map(), new Map());

        expect(context.cliConfig.name).toEqual('foobar');
    });

    test('Service configs is populated', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceConfigs = new Map<string, any>();

        serviceConfigs.set('foo', 'bar');

        const context = new DefaultContext(getCliConfig(), new DefaultServiceRegistry(),
            new DefaultCommandRegistry(), serviceConfigs, new Map());

        expect(context.serviceConfigs.get('foo')).toEqual('bar');
    });

    test('Command configs is populated', () => {
        const commandConfigs = new Map<string, CommandArgs>();

        commandConfigs.set('foo', { bar: 1 });

        const context = new DefaultContext(getCliConfig(), new DefaultServiceRegistry(),
            new DefaultCommandRegistry(), new Map(), commandConfigs);

        const config = context.commandConfigs.get('foo');
        expect(config).toBeDefined();
        if (config) {
            expect(config.bar).toEqual(1);
        }
    });
});
