import CoreServiceFactory from '../../src/core/CoreServiceFactory';

describe('CoreServiceFactory test', () => {

    test('CoreServiceFactory is instantiable', () => {
        expect(new CoreServiceFactory(process.stdin, process.stdout, process.stderr))
            .toBeInstanceOf(CoreServiceFactory);
    });
});
