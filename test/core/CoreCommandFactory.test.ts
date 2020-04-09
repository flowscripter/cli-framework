import CoreCommandFactory from '../../src/core/CoreCommandFactory';

describe('CoreCommandFactory test', () => {

    test('CoreCommandFactory is instantiable', () => {
        expect(new CoreCommandFactory()).toBeInstanceOf(CoreCommandFactory);
    });
});
