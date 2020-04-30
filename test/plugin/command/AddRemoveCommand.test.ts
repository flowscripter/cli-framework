/* eslint-disable @typescript-eslint/no-empty-function */

import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import { AddCommand, RemoveCommand } from '../../../src/plugin/command/AddRemoveCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import { CommandArgs } from '../../../src';
import { StderrPrinterService } from '../../../src/core/service/PrinterService';
import { PluginRegistryService } from '../../../src/plugin/service/PluginRegistryService';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getDependencies,
    getInstalledDependencies,
    installPackage,
    uninstallPackage,
    PackageSpec
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('../../../src/plugin/command/NpmPackageUtils');

const mockedGetAllInstalledPackages = getAllInstalledPackages as jest.Mock<Promise<PackageSpec[]>>;
const mockedGetInstalledTopLevelPackages = getInstalledTopLevelPackages as jest.Mock<Promise<PackageSpec[]>>;
const mockedGetDependencies = getDependencies as jest.Mock<Promise<PackageSpec[]>>;
const mockedGetInstalledDependencies = getInstalledDependencies as jest.Mock<Promise<PackageSpec[]>>;
const mockedInstallPackage = installPackage as jest.Mock<Promise<void>>;
const mockedUninstallPackage = uninstallPackage as jest.Mock<Promise<void>>;

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('AddRemoveCommand test', () => {

    beforeAll(() => {
        expect(mockedGetDependencies).toBeDefined();
        mockedGetAllInstalledPackages.mockImplementation(async (): Promise<PackageSpec[]> => [
            { name: 'a', version: '1' },
            { name: 'b', version: '2' },
            { name: 'c', version: '3' },
            { name: 'h', version: '8' },
            { name: 'i', version: '9' }
        ]);
        mockedGetInstalledTopLevelPackages.mockImplementation(async (): Promise<PackageSpec[]> => [
            { name: 'a', version: '1' },
            { name: 'b', version: '2' },
            { name: 'h', version: '8' }
        ]);
        mockedGetDependencies.mockImplementation((remoteModuleRegistry: string, packageSpec: PackageSpec):
        Promise<PackageSpec[]> => {
            if (packageSpec.name === 'a') {
                return Promise.resolve([
                    { name: 'a', version: '1', tarballUri: 'registry/a/a-1.tgz' },
                    { name: 'c', version: '3', tarballUri: 'registry/c/c-3.tgz' }
                ]);
            }
            if (packageSpec.name === 'b') {
                return Promise.resolve([
                    { name: 'b', version: '2', tarballUri: 'registry/b/b-2.tgz' },
                    { name: 'c', version: '3', tarballUri: 'registry/c/c-3.tgz' }
                ]);
            }
            if (packageSpec.name === 'd') {
                return Promise.resolve([
                    { name: 'd', version: '4', tarballUri: 'registry/d/d-4.tgz' },
                    { name: 'c', version: '3', tarballUri: 'registry/c/c-3.tgz' }
                ]);
            }
            if (packageSpec.name === 'e') {
                return Promise.resolve([
                    { name: 'e', version: '5', tarballUri: 'registry/e/e-5.tgz' },
                    { name: 'f', version: '6', tarballUri: 'registry/f/f-6.tgz' }
                ]);
            }
            if (packageSpec.name === 'g') {
                return Promise.resolve([
                    { name: 'g', version: '7', tarballUri: 'registry/g/g-7.tgz' },
                    { name: 'c', version: '4', tarballUri: 'registry/c/c-4.tgz' }
                ]);
            }
            if (packageSpec.name === 'h') {
                return Promise.resolve([
                    { name: 'h', version: '8', tarballUri: 'registry/h/h-8.tgz' },
                    { name: 'i', version: '9', tarballUri: 'registry/i/i-9.tgz' }
                ]);
            }
            return Promise.resolve([]);
        });
        mockedGetInstalledDependencies.mockImplementation(async (packageLocation: string,
            packageSpecs: PackageSpec[]): Promise<PackageSpec[]> => {
            if (packageSpecs.find((packageSpec) => packageSpec.name === 'a' && packageSpec.version === '1')) {
                return [
                    { name: 'a', version: '1' },
                    { name: 'c', version: '3' }
                ];
            }
            if (packageSpecs.find((packageSpec) => packageSpec.name === 'b' && packageSpec.version === '2')) {
                return [
                    { name: 'b', version: '2' },
                    { name: 'c', version: '3' }
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
            remoteModuleRegistry: 'registry'
        });

        const context = getContext(cliConfig, [stderrService, pluginRegistryService], [], new Map(), configMap);

        await pluginRegistryService.init(context);

        await addCommand.run({ name: 'd' }, context);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'd', version: '4', tarballUri: 'registry/d/d-4.tgz' });

        clearMocks();

        await addCommand.run({ name: 'e' }, context);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'e', version: '5', tarballUri: 'registry/e/e-5.tgz' });
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'f', version: '6', tarballUri: 'registry/f/f-6.tgz' });

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
            remoteModuleRegistry: 'registry'
        });

        const context = getContext(cliConfig, [stderrService, pluginRegistryService], [], new Map(), configMap);

        await pluginRegistryService.init(context);

        await removeCommand.run({ name: 'h' }, context);
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'h', tarballUri: 'registry/h/h-8.tgz', version: '8' });
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'i', tarballUri: 'registry/i/i-9.tgz', version: '9' });
    });
});
