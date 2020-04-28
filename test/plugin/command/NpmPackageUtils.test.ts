/* eslint-disable @typescript-eslint/no-explicit-any */

import { promises as fs, constants } from 'fs';
import path from 'path';
import mockFs from 'mock-fs';
import {
    extract,
    packument,
    FetchResult,
    Packument, Manifest
} from 'pacote';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getInstalledDependencies,
    getDependencies,
    installPackage,
    uninstallPackage
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('pacote');

const mockExtract = extract as jest.Mock<Promise<FetchResult>>;
const mockPackument = packument as jest.Mock<Promise<Packument>>;

const packumentE = {
    name: 'e',
    versions: {
        5: {
            name: 'e',
            version: '5',
            dependencies: {
                f: '6'
            }
        } as unknown as Manifest
    }
} as unknown as Packument;

const packumentF = {
    name: 'f',
    versions: {
        6: {
            name: 'f',
            version: '6'
        } as unknown as Manifest
    }
} as unknown as Packument;

describe('NpmPackageUtils test', () => {

    beforeEach(() => {
        mockFs({
            '/location': {
                a: {
                    'package.json': JSON.stringify({
                        name: 'a',
                        version: '1',
                        dependencies: {
                            c: '3'
                        }
                    })
                },
                b: {
                    'package.json': JSON.stringify({
                        name: 'b',
                        version: '2',
                        dependencies: {
                            c: '3'
                        }
                    })
                },
                c: {
                    'package.json': JSON.stringify({
                        name: 'c',
                        version: '3'
                    })
                },
                h: {
                    'package.json': JSON.stringify({
                        name: 'h',
                        version: '8',
                        dependencies: {
                            i: '9'
                        }
                    })
                },
                i: {
                    'package.json': JSON.stringify({
                        name: 'i',
                        version: '9'
                    })
                }
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    test('getAllInstalledPackages', async () => {
        const installed = await getAllInstalledPackages('/location');
        expect(installed).toEqual([
            'a@1',
            'b@2',
            'c@3',
            'h@8',
            'i@9'
        ]);
    });

    test('getInstalledTopLevelPackages', async () => {
        const installed = await getInstalledTopLevelPackages('/location');
        expect(installed).toEqual([
            'a@1',
            'b@2',
            'h@8'
        ]);
    });

    test('getInstalledDependencies', async () => {
        const installed = await getInstalledDependencies('/location', ['a@1', 'h@8']);
        expect(installed).toEqual([
            'a@1',
            'c@3',
            'h@8',
            'i@9'
        ]);
    });

    test('packageDependencyGenerator', async () => {

        mockPackument.mockImplementationOnce(() => Promise.resolve(packumentE));
        mockPackument.mockImplementationOnce(() => Promise.resolve(packumentF));

        let dependencies = await getDependencies('registry', 'cache', 'e', '5');
        expect(dependencies).toEqual([
            'e@5',
            'f@6'
        ]);

        mockPackument.mockImplementationOnce(() => Promise.resolve(packumentE));
        mockPackument.mockImplementationOnce(() => Promise.resolve(packumentF));

        dependencies = await getDependencies('registry', 'cache', 'e');
        expect(dependencies).toEqual([
            'e@5',
            'f@6'
        ]);
    });

    test('installPackage', async () => {
        mockPackument.mockImplementationOnce(() => Promise.resolve(packumentE));

        mockExtract.mockImplementation(async (packageSpec: string, packageLocation: string) => {
            const packageName = packageSpec.split('@')[0];
            await fs.mkdir(path.join(packageLocation, packageName));
            return Promise.resolve({
                from: 'mock',
                resolved: 'mock',
                integrity: 'mock'
            });
        });

        await expect(fs.access('/location/e', constants.F_OK)).rejects.toThrowError();
        await installPackage('/location', 'registry', 'cache', 'e@5');
        await fs.access('/location/e', constants.F_OK);
    });

    test('uninstallPackage', async () => {
        await fs.access('/location/a', constants.F_OK);
        await uninstallPackage('/location', 'a@1');
        await expect(fs.access('/location/a', constants.F_OK)).rejects.toThrowError();
    });
});
