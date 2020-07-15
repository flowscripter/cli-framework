import { mockProcessStdout } from 'jest-mock-process';
import mockProcessStdIn from 'mock-stdin';
import kleur from 'kleur';

import { PrompterService } from '../../../src/core/service/PrompterService';
import { getContext } from '../../fixtures/Context';
import CLIConfig from '../../../src/api/CLIConfig';

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
        expect(new PrompterService(1)).toBeInstanceOf(PrompterService);
    });

    test('Error thrown for init requirements', async () => {
        const ps = new PrompterService(100);

        let context = getContext({
            stdout: process.stdout
        } as unknown as CLIConfig, [ps], []);
        expect(() => ps.init(context)).toThrowError();

        context = getContext({
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        expect(() => ps.init(context)).toThrowError();
    });

    test('Error thrown before init called', async () => {
        const ps = new PrompterService(100);

        await expect(() => ps.readable).toThrowError();

        const context = getContext({
            stdin: process.stdin,
            stdout: process.stdout
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);
        expect(ps.readable).not.toBeNull();
    });

    test('Readable accessible', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('bar\r');
        });

        const response = await new Promise((resolve) => {
            ps.readable.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
        expect(response).toEqual('bar');
    });

    test('Text prompt works', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('bar\r');
            mockStdIn.end();
        });

        const response = await ps.stringPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual('bar');
    });

    test('Number prompt works for integer', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('11\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(11);
    });

    test('Number prompt works for float with default rounding', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('1.123\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo', true);

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(1.12);
    });

    test('Number prompt works for float with non-default rounding', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('1.1236\r');
            mockStdIn.end();
        });

        const response = await ps.numberPrompt('foo', true, 3);

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(1.124);
    });

    test('Boolean prompt works', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('y\r');
            mockStdIn.end();
        });

        const response = await ps.booleanPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual(true);
    });

    test('Password prompt works', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

        process.nextTick(() => {
            mockStdIn.send('secret\r');
            mockStdIn.end();
        });

        const response = await ps.passwordPrompt('foo');

        expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining('foo'));
        expect(response).toEqual('secret');
    });

    test('Select prompt works', async () => {
        const ps = new PrompterService(100);
        const context = getContext({
            stdout: process.stdout,
            stdin: process.stdin
        } as unknown as CLIConfig, [ps], []);
        ps.init(context);

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
