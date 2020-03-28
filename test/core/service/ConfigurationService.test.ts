/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import mockFs from 'mock-fs';
import * as yaml from 'js-yaml';
import * as os from 'os';
import { ConfigurationService } from '../../../src/core/service/ConfigurationService';
import { CommandArgs } from '../../../src';
import Context from '../../../src/api/Context';
import DefaultContext from '../../../src/runtime/DefaultContext';

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('ConfigurationService test', () => {

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

    function getContext(): Context {
        return new DefaultContext({
            name: 'cli',
            description: 'my cli',
            version: '1.2.3'
        }, [], [], new Map(), new Map());
    }

    afterAll(() => {
        mockFs.restore();
    });

    test('ConfigurationService is instantiable', () => {
        expect(new ConfigurationService(100)).toBeInstanceOf(ConfigurationService);
    });

    test('Read from default config location', () => {
        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump(getAssociativeArrayFromMap(getConfigMap()))
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        expect(configuration.configurationLocation).toBeUndefined();
        configuration.init(context);
        expect(configuration.configurationLocation).toEqual(`${os.homedir()}/.cli.yaml`);
        expect(context.serviceConfigs.size).toEqual(1);
        expect(context.commandConfigs.size).toEqual(1);
    });

    test('Read from custom config location', () => {
        mockFs({
            '/foo.yaml':
                yaml.safeDump(getAssociativeArrayFromMap(getConfigMap()))
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();

        context.serviceConfigs.set(configuration.id, {
            configFilePath: '/foo.yaml'
        });
        expect(configuration.configurationLocation).toBeUndefined();
        configuration.init(context);
        expect(configuration.configurationLocation).toEqual('/foo.yaml');
        expect(context.serviceConfigs.size).toEqual(2);
        expect(context.commandConfigs.size).toEqual(1);
    });

    test('Default config file not readable is not an error', () => {
        mockFs({});

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        expect(configuration.configurationLocation).toBeUndefined();
        configuration.init(context);
        expect(configuration.configurationLocation).toEqual(`${os.homedir()}/.${context.cliConfig.name}.yaml`);
    });

    test('Custom config file not readable is an error', () => {
        mockFs({});

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        context.serviceConfigs.set(configuration.id, {
            configFilePath: '/foo.yaml'
        });
        expect(configuration.configurationLocation).toBeUndefined();
        expect(() => {
            configuration.init(context);
        }).toThrow();
    });

    test('Read empty config', () => {
        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump({})
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        configuration.init(context);
        expect(context.serviceConfigs.size).toEqual(0);
        expect(context.commandConfigs.size).toEqual(0);
    });

    test('Get and set command config', () => {
        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump({})
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        const commandArgs: CommandArgs = { foo: 'bar' };
        configuration.init(context);
        configuration.setCommandConfig('command', commandArgs);
        expect(configuration.getCommandConfig('command')).toEqual(commandArgs);
    });

    test('Get and set service config', () => {
        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump({})
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        const serviceConfig = { foo: 'bar' };
        configuration.init(context);
        configuration.setServiceConfig('serviceA', serviceConfig);
        expect(configuration.getServiceConfig('serviceA')).toEqual(serviceConfig);
    });

    test('Set custom config file location which is not readable is an error', () => {
        mockFs({});

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        configuration.init(context);

        configuration.configurationLocation = '/foo.yaml';
        expect(() => {
            configuration.getConfig();
        }).toThrow();
    });

    test('Set custom config file after init returns different config', () => {
        mockFs({
            [`${os.homedir()}/.cli.yaml`]:
                yaml.safeDump({}),
            '/foo.yaml':
                yaml.safeDump(getAssociativeArrayFromMap(getConfigMap()))
        });

        const configuration = new ConfigurationService(100);

        const context: Context = getContext();
        configuration.init(context);

        expect(configuration.getConfig().serviceConfigs.size).toEqual(0);
        configuration.configurationLocation = '/foo.yaml';
        expect(configuration.getConfig().serviceConfigs.size).toEqual(1);
    });
});
