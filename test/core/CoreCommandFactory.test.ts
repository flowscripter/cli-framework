import CoreCommandFactory from '../../src/core/CoreCommandFactory';

describe('CoreCommandFactory test', () => {

    test('CoreCommandFactory is instantiable', () => {
        expect(new CoreCommandFactory('cli', 'my cli', '1.2.3')).toBeInstanceOf(CoreCommandFactory);
    });
});
