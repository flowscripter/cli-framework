import CoreServiceFactory from '../../src/core/CoreServiceFactory';

describe('CoreServiceFactory test', () => {

    test('CoreServiceFactory is instantiable', () => {
        expect(new CoreServiceFactory())
            .toBeInstanceOf(CoreServiceFactory);
    });
});
