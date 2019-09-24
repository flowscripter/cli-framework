import { Foo, Bar } from 'index';

/**
 * Foo test
 */
describe('Foo test', () => {

    test('works if true is truthy', () => {
        expect(true).toBeTruthy();
    });

    test('Foo is instantiable', () => {
        expect(new Foo(new Bar())).toBeInstanceOf(Foo);
    });

    test('Foo dump works', () => {
        new Foo(new Bar()).dump();
    });
});
