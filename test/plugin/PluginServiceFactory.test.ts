import PluginServiceFactory from '../../src/plugin/PluginServiceFactory';

describe('PluginServiceFactory test', () => {

    test('PluginServiceFactory is instantiable', () => {
        expect(new PluginServiceFactory()).toBeInstanceOf(PluginServiceFactory);
    });
});
