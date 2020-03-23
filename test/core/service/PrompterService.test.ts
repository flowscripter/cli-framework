import { mockProcessStdout } from 'jest-mock-process';
import mockProcessStdIn from 'mock-stdin';
import kleur from 'kleur';

import { PrompterService } from '../../../src/core/service/PrompterService';

const mockStdout = mockProcessStdout();
const mockStdIn = mockProcessStdIn.stdin();

describe('PrompterService test', () => {

    beforeAll(() => {
        kleur.enabled = false;
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStdIn.restore();
        kleur.enabled = true;
    });

    beforeEach(() => {
        mockStdout.mockReset();
        mockStdIn.reset();
    });

    test('PrompterService is instantiable', () => {
        expect(new PrompterService(process.stdin, process.stdout, 1)).toBeInstanceOf(PrompterService);
    });

    test('Text prompt works', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('bar\r');
            mockStdIn.end();
        });

        const response = await ps.stringPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual('bar');
    });

    test('Number prompt works for integer', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('11\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(11);
    });

    test('Number prompt works for float with default rounding', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('1.123\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo', true);

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(1.12);
    });

    test('Number prompt works for float with non-default rounding', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('1.1236\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo', true, 3);

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(1.124);
    });

    test('Boolean prompt works', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('y\r');
            mockStdIn.end();
        });

        const response = await ps.booleanPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(true);
    });

    test('Password prompt works', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('secret\r');
            mockStdIn.end();
        });

        const response = await ps.passwordPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual('secret');
    });

    test('Select prompt works', async () => {
        const ps = new PrompterService(process.stdin, process.stdout, 100);

        process.nextTick(() => {
            mockStdIn.send('\r');
            mockStdIn.end();
        });

        const response = await ps.selectPrompt('foo', [{
            title: 'bar',
            value: 1
        }]);

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(1);
    });
});
