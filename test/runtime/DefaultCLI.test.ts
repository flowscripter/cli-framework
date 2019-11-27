import DefaultCLI from '../../src/runtime/DefaultCLI';
import CommandFactoryA from '../fixtures/CommandFactoryA';
import ServiceFactoryA from '../fixtures/ServiceFactoryA';

describe('DefaultCLI test', () => {

    test('DefaultCLI is instantiable', () => {
        expect(new DefaultCLI()).toBeInstanceOf(DefaultCLI);
    });

    test('ServiceFactory is registered', () => {
        const cli = new DefaultCLI();

        expect(cli.getServiceFactories()).toHaveLength(0);

        cli.addServiceFactory(new ServiceFactoryA());

        expect(cli.getServiceFactories()).toHaveLength(1);
    });

    test('CommandFactory is registered', () => {
        const cli = new DefaultCLI();

        expect(cli.getCommandFactories()).toHaveLength(0);

        cli.addCommandFactory(new CommandFactoryA());

        expect(cli.getCommandFactories()).toHaveLength(1);
    });
});
