/* eslint-disable @typescript-eslint/no-explicit-any */

import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import SubCommandA from '../fixtures/SubCommandA';
import ServiceA, { SERVICE_ID_A } from '../fixtures/ServiceA';
import { getCliConfig } from '../fixtures/CLIConfig';
import BaseCLI from '../../src/cli/BaseCLI';
import VersionCommand from '../../src/core/command/VersionCommand';
import { RunResult } from '../../src/api/Runner';
import {
    StderrPrinterService,
    StdoutPrinterService,
    STDERR_PRINTER_SERVICE
} from '../../src/core/service/PrinterService';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('BaseCLI test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    test('BaseCLI is instantiable', () => {
        expect(new BaseCLI(getCliConfig(), [], [], new Map(), new Map())).toBeInstanceOf(BaseCLI);
    });

    test('Service is registered without error', () => {
        expect(new BaseCLI(getCliConfig(), [new ServiceA()], [], new Map(),
            new Map())).toBeInstanceOf(BaseCLI);
    });

    test('Command is registered without error', () => {
        expect(new BaseCLI(getCliConfig(), [], [new SubCommandA()], new Map(),
            new Map())).toBeInstanceOf(BaseCLI);
    });

    test('Default command is run', async () => {
        const cli = new BaseCLI(getCliConfig(), [
            new StderrPrinterService(1),
            new StdoutPrinterService(1)
        ], [],
        new Map(), new Map(), new VersionCommand());
        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
    });

    test('Warning for unknown command', async () => {
        const serviceConfigs = new Map();
        serviceConfigs.set(STDERR_PRINTER_SERVICE, { colorEnabled: false });
        const cli = new BaseCLI(getCliConfig(), [
            new StderrPrinterService(1),
            new StdoutPrinterService(1)
        ], [], serviceConfigs,
        new Map(), new VersionCommand());
        const result = await cli.execute(['blah']);
        expect(result).toEqual(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: blah'));
    });

    test('Warning for unknown global argument', async () => {
        const serviceConfigs = new Map();
        serviceConfigs.set(STDERR_PRINTER_SERVICE, { colorEnabled: false });
        const cli = new BaseCLI(getCliConfig(), [new StderrPrinterService(1)], [new SubCommandA()],
            serviceConfigs, new Map());
        const result = await cli.execute(['--nnn', 'command_a', '--foo=hello']);
        expect(result).toEqual(RunResult.Success);
        expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining('Unused arg: --nnn'));
    });

    test('Default command is run with required arguments provided in config', async () => {
        const commandConfigs = new Map<string, any>();
        commandConfigs.set('command_a', {
            foo: 'bar'
        });
        const cli = new BaseCLI(getCliConfig(), [new StderrPrinterService(1)], [new SubCommandA()],
            new Map(), commandConfigs, new SubCommandA());
        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
    });

    test('Service is configured with provided config', async () => {
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set(SERVICE_ID_A, {
            foo: 'bar'
        });
        const serviceA = new ServiceA();
        const cli = new BaseCLI(getCliConfig(), [
            serviceA,
            new StderrPrinterService(1),
            new StdoutPrinterService(1)
        ], [],
        serviceConfigs, new Map(), new VersionCommand());
        const result = await cli.execute([]);
        expect(result).toEqual(RunResult.Success);
        expect(serviceA.config.foo).toEqual('bar');
    });
});
