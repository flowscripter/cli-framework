/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import * as os from 'os';
import * as yaml from 'js-yaml';
import mockFs from 'mock-fs';
import { mockProcessStderr, mockProcessStdout } from 'jest-mock-process';
import ConfigCommand from '../../../src/core/command/ConfigCommand';
import { StderrPrinterService } from '../../../src/core/service/PrinterService';
import { CommandArgs } from '../../../src';
import { ConfigurationService } from '../../../src/core/service/ConfigurationService';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('ConfigCommand test', () => {

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    function getConfigMap(): Map<string, any> {
        const serviceConfigs = new Map<string, any>();
        serviceConfigs.set('serviceA', { foo: 'bar' });

        const commandConfigs = new Map<string, CommandArgs>();
        commandConfigs.set('command1', { goo: 'gar' });

        const config = new Map<string, any>();
        config.set('serviceConfigs', serviceConfigs);
        config.set('commandConfigs', commandConfigs);
        return config;
    }

    function getAssociativeArrayFromMap(map: Map<string, any>): string {
        const associativeArray: any = {};
        map.forEach((value, key) => {
            if (_.isMap(value)) {
                associativeArray[key] = getAssociativeArrayFromMap(value);
            } else {
                associativeArray[key] = value;
            }
        });
        return associativeArray;
    }

    afterAll(() => {
        mockFs.restore();
    });

    test('ConfigCommand is instantiable', () => {
        expect(new ConfigCommand(100)).toBeInstanceOf(ConfigCommand);
    });

    test('Error on config file is a directory', async () => {

        mockFs({
            '/foo.bar': {
                fileA: 'hello'
            }
        });

        const stderrService = new StderrPrinterService(100);
        stderrService.colorEnabled = false;
        const context = getContext(getCliConfig(), [stderrService], []);
        stderrService.init(context);

        const configCommand = new ConfigCommand(100);

        await expect(configCommand.run({ config: '/foo.bar' }, context)).rejects.toThrowError();
    });

    test('Error on config file is not readable', async () => {

        mockFs({
            '/foo.bar': mockFs.file({
                content: 'foo',
                mode: 0o0
            })
        });

        const stderrService = new StderrPrinterService(100);
        stderrService.colorEnabled = false;

        const context = getContext(getCliConfig(), [stderrService], []);
        stderrService.init(context);
        const configCommand = new ConfigCommand(100);

        await expect(configCommand.run({ config: '/foo.bar' }, context)).rejects.toThrowError();
    });

    test('Custom config location is set', async () => {

        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump({}),
            '/foo.bar':
                yaml.safeDump(getAssociativeArrayFromMap(getConfigMap()))
        });

        const stderrService = new StderrPrinterService(100);
        stderrService.colorEnabled = false;
        const configurationService = new ConfigurationService(100);
        const context = getContext(getCliConfig(), [stderrService, configurationService], []);
        configurationService.init(context);
        stderrService.init(context);

        expect(configurationService.getConfig().serviceConfigs.size).toEqual(0);

        const configCommand = new ConfigCommand(100);
        await configCommand.run({ location: '/foo.bar' }, context);

        expect(configurationService.configurationLocation).toEqual('/foo.bar');
        expect(configurationService.getConfig().serviceConfigs.size).toEqual(1);
    });
});
