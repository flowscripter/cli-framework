/* eslint-disable @typescript-eslint/no-empty-function */

import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import { AddCommand, RemoveCommand } from '../../../src/plugin/command/AddRemoveCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CliConfig';
import { CommandArgs } from '../../../src';
import { StderrPrinterService } from '../../../src/core/service/PrinterService';
import { PluginRegistryService } from '../../../src/plugin/service/PluginRegistryService';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getDependencies,
    getInstalledDependencies,
    installPackage,
    uninstallPackage
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('../../../src/plugin/command/NpmPackageUtils');

const mockedGetAllInstalledPackages = getAllInstalledPackages as jest.Mock<Promise<string[]>>;
const mockedGetInstalledTopLevelPackages = getInstalledTopLevelPackages as jest.Mock<Promise<string[]>>;
const mockedGetDependencies = getDependencies as jest.Mock<Promise<string[]>>;
const mockedGetInstalledDependencies = getInstalledDependencies as jest.Mock<Promise<string[]>>;
const mockedInstallPackage = installPackage as jest.Mock<Promise<void>>;
const mockedUninstallPackage = uninstallPackage as jest.Mock<Promise<void>>;

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('AddRemoveCommand test', () => {

    beforeAll(() => {
        expect(mockedGetDependencies).toBeDefined();
        mockedGetAllInstalledPackages.mockImplementation(async (): Promise<string[]> => [
            'a@1',
            'b@2',
            'c@3',
            'h@8',
            'i@9'
        ]);
        mockedGetInstalledTopLevelPackages.mockImplementation(async (): Promise<string[]> => [
            'a@1',
            'b@2',
            'h@8'
        ]);
        mockedGetDependencies.mockImplementation((remoteModuleRegistry: string,
            localModuleCacheLocation: string, packageName: string): Promise<string[]> => {
            if (packageName === 'a') {
                return Promise.resolve([
                    'a@1',
                    'c@3'
                ]);
            }
            if (packageName === 'b') {
                return Promise.resolve([
                    'b@2',
                    'c@3'
                ]);
            }
            if (packageName === 'd') {
                return Promise.resolve([
                    'd@4',
                    'c@3'
                ]);
            }
            if (packageName === 'e') {
                return Promise.resolve([
                    'e@5',
                    'f@6'
                ]);
            }
            if (packageName === 'g') {
                return Promise.resolve([
                    'g@7',
                    'c@4'
                ]);
            }
            if (packageName === 'h') {
                return Promise.resolve([
                    'h@8',
                    'i@9'
                ]);
            }
            return Promise.resolve([]);
        });
        mockedGetInstalledDependencies.mockImplementation(async (packageLocation: string,
            packageSpecs: string[]): Promise<string[]> => {
            if (packageSpecs.includes('a@1')) {
                return [
                    'a@1',
                    'c@3'
                ];
            }
            if (packageSpecs.includes('b@2')) {
                return [
                    'b@2',
                    'c@3'
                ];
            }
            return [];
        });
        mockedInstallPackage.mockImplementation(async (): Promise<void> => {});
        mockedUninstallPackage.mockImplementation(async (): Promise<void> => {});
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    function clearMocks(): void {
        mockedGetAllInstalledPackages.mockClear();
        mockedGetInstalledTopLevelPackages.mockClear();
        mockedGetDependencies.mockClear();
        mockedGetInstalledDependencies.mockClear();
        mockedInstallPackage.mockClear();
        mockedUninstallPackage.mockClear();
    }

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
        clearMocks();
    });

    test('AddCommand is instantiable', () => {
        expect(new AddCommand()).toBeInstanceOf(AddCommand);
    });

    test('RemoveCommand is instantiable', () => {
        expect(new RemoveCommand()).toBeInstanceOf(RemoveCommand);
    });

    test('Commands expect correct config in context', async () => {
        const stderrService = new StderrPrinterService(100);
        const pluginRegistryService = new PluginRegistryService(90);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });

        const addCommand = new AddCommand();
        const removeCommand = new RemoveCommand();

        const context = getContext(cliConfig, [stderrService, pluginRegistryService], [], new Map(), new Map());
        await expect(addCommand.run({}, context)).rejects.toThrowError();
        await expect(removeCommand.run({}, context)).rejects.toThrowError();
    });

    test('Add command invokes expected package functions', async () => {
        const addCommand = new AddCommand();
        const stderrService = new StderrPrinterService(100);
        const pluginRegistryService = new PluginRegistryService(90);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });

        const configMap = new Map<string, CommandArgs>();
        configMap.set(addCommand.name, {
            remoteModuleRegistry: 'registry',
            localModuleCacheLocation: 'cache'
        });

        const context = getContext(cliConfig, [stderrService, pluginRegistryService], [], new Map(), configMap);

        await pluginRegistryService.init(context);

        await addCommand.run({ name: 'd' }, context);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins', 'registry', 'cache', 'd@4');

        clearMocks();

        await addCommand.run({ name: 'e' }, context);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins', 'registry', 'cache', 'e@5');
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins', 'registry', 'cache', 'f@6');

        clearMocks();

        // This should throw an error as NpmPackageUtils doesn't support multiple package versions i.e. == lame.
        await expect(addCommand.run({ name: 'g' }, context)).rejects.toThrowError();
    });

    test('Remove command invokes expected package functions', async () => {
        const removeCommand = new RemoveCommand();
        const stderrService = new StderrPrinterService(100);
        const pluginRegistryService = new PluginRegistryService(90);

        const cliConfig = getCliConfig({
            pluginManager: NodePluginManager,
            pluginLocation: '/plugins'
        });

        const configMap = new Map<string, CommandArgs>();
        configMap.set(removeCommand.name, {
            remoteModuleRegistry: 'registry',
            localModuleCacheLocation: 'cache'
        });

        const context = getContext(cliConfig, [stderrService, pluginRegistryService], [], new Map(), configMap);

        await pluginRegistryService.init(context);

        await removeCommand.run({ name: 'h' }, context);
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins', 'h@8');
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins', 'i@9');
    });
});
