import PluginCommandFactory from '../../src/plugin/PluginCommandFactory';

describe('PluginCommandFactory test', () => {

    test('PluginCommandFactory is instantiable', () => {
        expect(new PluginCommandFactory()).toBeInstanceOf(PluginCommandFactory);
    });
});
