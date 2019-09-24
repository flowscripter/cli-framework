import { Bar } from 'index';

/**
 * Bar test
 */
describe('Bar test', () => {

    test('works if true is truthy', () => {
        expect(true).toBeTruthy();
    });

    test('Bar is instantiable', () => {
        expect(new Bar()).toBeInstanceOf(Bar);
    });

    test('Bar dump works', () => {
        new Bar().dump();
    });

    test('iHazError throws', () => {
        expect(() => {
            new Bar().iHazError(true);
        }).toThrow();
    });

    test('iHazError does not throw', () => {
        new Bar().iHazError(false);
    });
});
