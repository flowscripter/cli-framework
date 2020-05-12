/* eslint-disable @typescript-eslint/no-empty-function */

import mockFs from 'mock-fs';
import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import { NodePluginManager } from '@flowscripter/esm-dynamic-plugins';
import { AddCommand, RemoveCommand } from '../../../src/plugin/command/AddRemoveCommand';
import { getContext } from '../../fixtures/Context';
import { getCliConfig } from '../../fixtures/CLIConfig';
import { CommandArgs } from '../../../src';
import { StderrPrinterService } from '../../../src/core/service/PrinterService';
import { PluginRegistryService } from '../../../src/plugin/service/PluginRegistryService';
import {
    getInstalledPackages,
    resolvePackageSpec,
    installPackage,
    uninstallPackage,
    PackageSpec
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('../../../src/plugin/command/NpmPackageUtils');

const mockedGetInstalledPackages = getInstalledPackages as jest.Mock<Promise<PackageSpec[]>>;
const mockedResolvePackageSpec = resolvePackageSpec as jest.Mock<Promise<PackageSpec>>;
const mockedInstallPackage = installPackage as jest.Mock<Promise<void>>;
const mockedUninstallPackage = uninstallPackage as jest.Mock<Promise<void>>;

const mockStdout = mockProcessStdout();
const mockStderr = mockProcessStderr();

describe('AddRemoveCommand test', () => {

    function clearMocks(): void {
        mockedGetInstalledPackages.mockClear();
        mockedResolvePackageSpec.mockClear();
        mockedInstallPackage.mockClear();
        mockedUninstallPackage.mockClear();
    }

    beforeAll(() => {
        mockedGetInstalledPackages.mockImplementation(async (): Promise<PackageSpec[]> => [
            { name: '@foo/c', version: '1.0.0' },
            { name: 'd', version: '2.0.0' }
        ]);
        mockedResolvePackageSpec.mockImplementation((remoteModuleRegistry: string, packageSpec: PackageSpec):
        Promise<PackageSpec> => {
            if (packageSpec.name === '@foo/a') {
                return Promise.resolve({ name: '@foo/a', version: '1.0.0', tarballUri: 'registry/@foo/a/a-1.0.0.tgz' });
            }
            if (packageSpec.name === 'b') {
                return Promise.resolve({ name: 'b', version: '2.0.0', tarballUri: 'registry/b/b-2.0.0.tgz' });
            }
            if (packageSpec.name === '@foo/c') {
                return Promise.resolve({ name: '@foo/c', version: '1.0.0', tarballUri: 'registry/@foo/c/c-1.0.0.tgz' });
            }
            if (packageSpec.name === 'd') {
                return Promise.resolve({ name: 'd', version: '2.0.0', tarballUri: 'registry/d/d-2.0.0.tgz' });
            }
            throw new Error();
        });
        mockedInstallPackage.mockImplementation(async (): Promise<void> => {});
        mockedUninstallPackage.mockImplementation(async (): Promise<void> => {});
    });

    afterAll(() => {
        mockStdout.mockRestore();
        mockStderr.mockRestore();
    });

    beforeEach(() => {
        mockStdout.mockReset();
        mockStderr.mockReset();
        clearMocks();
    });

    afterEach(() => {
        mockFs.restore();
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
        mockFs({
            '/plugins': {}
        });

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
        await stderrService.init(context);

        await addCommand.run({ name: 'b' }, context);
        expect(mockedInstallPackage).toBeCalledTimes(1);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'b', version: '2.0.0', tarballUri: 'registry/b/b-2.0.0.tgz' });

        await addCommand.run({ name: '@foo/a' }, context);
        expect(mockedInstallPackage).toBeCalledTimes(2);
        expect(mockedInstallPackage).toHaveBeenCalledWith('/plugins',
            { name: '@foo/a', version: '1.0.0', tarballUri: 'registry/@foo/a/a-1.0.0.tgz' });

        await addCommand.run({ name: 'd' }, context);
        // should not have been called again as d was already installed
        expect(mockedInstallPackage).toBeCalledTimes(2);
    });

    test('Remove command invokes expected package functions', async () => {
        mockFs({
            '/plugins': {}
        });

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
        await stderrService.init(context);

        await removeCommand.run({ name: 'd' }, context);
        expect(mockedUninstallPackage).toBeCalledTimes(1);
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins',
            { name: 'd', version: '2.0.0' });

        await removeCommand.run({ name: '@foo/c' }, context);
        expect(mockedUninstallPackage).toBeCalledTimes(2);
        expect(mockedUninstallPackage).toHaveBeenCalledWith('/plugins',
            { name: '@foo/c', version: '1.0.0' });

        await removeCommand.run({ name: 'b' }, context);
        // should not have been called again as b wasn't installed
        expect(mockedUninstallPackage).toBeCalledTimes(2);
    });
});
