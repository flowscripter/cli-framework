import BaseCLI from '../../src/cli/BaseCLI';
import CommandFactoryA from '../fixtures/CommandFactoryA';
import ServiceFactoryA from '../fixtures/ServiceFactoryA';

describe('DefaultCLI test', () => {

    test('DefaultCLI is instantiable', () => {
        expect(new BaseCLI(process.stdout)).toBeInstanceOf(BaseCLI);
    });

    test('ServiceFactory is registered', () => {
        const cli = new BaseCLI(process.stdout);

        expect(cli.getServiceFactories()).toHaveLength(1);

        cli.addServiceFactory(new ServiceFactoryA());

        expect(cli.getServiceFactories()).toHaveLength(2);
    });

    test('CommandFactory is registered', () => {
        const cli = new BaseCLI(process.stdout);

        expect(cli.getCommandFactories()).toHaveLength(1);

        cli.addCommandFactory(new CommandFactoryA());

        expect(cli.getCommandFactories()).toHaveLength(2);
    });

    test('Default command is run with required arguments', () => {
        const cli = new BaseCLI(process.stdout);

        cli.addCommandFactory(new CommandFactoryA());

        cli.execute(['--foo', 'bar']);
    });

    test('Default command is run with required arguments provided in config', () => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: Map<string, any> = new Map();
        config.set('command_a', {
            foo: 'bar'
        });

        const cli = new BaseCLI(process.stdout, config);

        cli.addCommandFactory(new CommandFactoryA());

        cli.execute([]);
    });
});
