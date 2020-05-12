import { promises as fs, constants } from 'fs';
import mockFs from 'mock-fs';
import axios from 'axios';
import tar from 'tar-fs';
import {
    getAllInstalledPackages,
    getInstalledTopLevelPackages,
    getInstalledDependencies,
    getDependencies,
    installPackage,
    uninstallPackage
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const packumentE = {
    name: 'e',
    'dist-tags': {
        latest: '5.0.0'
    },
    versions: {
        '5.0.0': {
            name: 'e',
            version: '5.0.0',
            dependencies: {
                f: '6.0.0'
            },
            dist: {
                tarball: 'registry/e/e-5.0.0.tgz'
            }
        },
        '4.0.0': {
            name: 'e',
            version: '4.0.0',
            dependencies: {
                f: '5.0.0'
            },
            dist: {
                tarball: 'registry/e/e-4.0.0.tgz'
            }
        }
    }
};

const packumentF = {
    name: 'f',
    'dist-tags': {
        latest: '6.0.0'
    },
    versions: {
        '6.0.0': {
            name: 'f',
            version: '6.0.0',
            dist: {
                tarball: 'registry/f/f-6.0.0.tgz'
            }
        }
    }
};

const packumentZ = {
    name: 'z',
    'dist-tags': {
        next: '6.0.0'
    },
    versions: {
        '6.0.0': {
            name: 'z',
            version: '6.0.0',
            dist: {
                tarball: 'registry/z/z-6.0.0.tgz'
            }
        }
    }
};

describe('NpmPackageUtils test', () => {

    beforeEach(() => {
        mockFs({
            '/location': {
                a: {
                    'package.json': JSON.stringify({
                        name: 'a',
                        version: '1.0.0',
                        dependencies: {
                            c: '3.0.0'
                        }
                    })
                },
                b: {
                    'package.json': JSON.stringify({
                        name: 'b',
                        version: '2.0.0',
                        dependencies: {
                            c: '3.0.0'
                        }
                    })
                },
                c: {
                    'package.json': JSON.stringify({
                        name: 'c',
                        version: '3.0.0'
                    })
                },
                h: {
                    'package.json': JSON.stringify({
                        name: 'h',
                        version: '8.0.0',
                        dependencies: {
                            i: '9.0.0'
                        }
                    })
                },
                i: {
                    'package.json': JSON.stringify({
                        name: 'i',
                        version: '9.0.0'
                    })
                },
                z: 'foo'
            },
            '/e': {
                a: {
                    'package.json': JSON.stringify({
                        name: 'e',
                        version: '5.0.0',
                        dependencies: {
                            f: '6.0.0'
                        }
                    })
                },
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    test('getAllInstalledPackages', async () => {
        const installed = await getAllInstalledPackages('/location');
        expect(installed).toEqual([
            { name: 'a', version: '1.0.0' },
            { name: 'b', version: '2.0.0' },
            { name: 'c', version: '3.0.0' },
            { name: 'h', version: '8.0.0' },
            { name: 'i', version: '9.0.0' }
        ]);
    });

    test('getInstalledTopLevelPackages', async () => {
        const installed = await getInstalledTopLevelPackages('/location');
        expect(installed).toEqual([
            { name: 'a', version: '1.0.0' },
            { name: 'b', version: '2.0.0' },
            { name: 'h', version: '8.0.0' }
        ]);
    });

    test('getInstalledDependencies', async () => {
        const installed = await getInstalledDependencies('/location', [
            { name: 'a', version: '1.0.0' },
            { name: 'h', version: '8.0.0' }
        ]);
        expect(installed).toEqual([
            { name: 'a', version: '1.0.0' },
            { name: 'c', version: '3.0.0' },
            { name: 'h', version: '8.0.0' },
            { name: 'i', version: '9.0.0' }
        ]);
    });

    test('packageDependencyGenerator success', async () => {

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentF }));

        let dependencies = await getDependencies('registry', { name: 'e', version: '5.0.0' });
        expect(dependencies).toEqual([
            { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' },
            { name: 'f', version: '6.0.0', tarballUri: 'registry/f/f-6.0.0.tgz' }
        ]);

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentF }));

        dependencies = await getDependencies('registry', { name: 'e' });
        expect(dependencies).toEqual([
            { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' },
            { name: 'f', version: '6.0.0', tarballUri: 'registry/f/f-6.0.0.tgz' }
        ]);
    });

    test('packageDependencyGenerator with semver success', async () => {

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentF }));

        const dependencies = await getDependencies('registry', { name: 'e', version: '^5.0.0' });
        expect(dependencies).toEqual([
            { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' },
            { name: 'f', version: '6.0.0', tarballUri: 'registry/f/f-6.0.0.tgz' }
        ]);
    });

    test('packageDependencyGenerator failure if no dist-tag latest when version unspecified', async () => {

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentZ }));
        await expect(getDependencies('registry', { name: 'g' })).rejects.toThrowError();
    });

    test('installPackage success', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/e') }));

        await expect(fs.access('/location/e', constants.F_OK)).rejects.toThrowError();
        await installPackage('/location', { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' });
        await fs.access('/location/e', constants.F_OK);
    });

    test('installPackage failure if folder exists', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/e') }));

        await fs.mkdir('/location/e');
        await fs.access('/location/e', constants.F_OK);
        await expect(installPackage('/location',
            { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' })).rejects.toThrowError();
    });

    test('uninstallPackage success', async () => {
        await fs.access('/location/a', constants.F_OK);
        await uninstallPackage('/location', { name: 'a', version: '1.0.0' });
        await expect(fs.access('/location/a', constants.F_OK)).rejects.toThrowError();
    });

    test('uninstallPackage failure if version not specified', async () => {
        await fs.access('/location/a', constants.F_OK);
        await expect(uninstallPackage('/location', { name: 'a' })).rejects.toThrowError();
    });

    test('uninstallPackage failure if file not folder exists', async () => {
        await expect(uninstallPackage('/location', { name: 'z', version: '1.0.0' })).rejects.toThrowError();
    });

    test('uninstallPackage failure if no package.json exists', async () => {
        await fs.unlink('/location/a/package.json');
        await expect(uninstallPackage('/location', { name: 'a', version: '1.0.0' })).rejects.toThrowError();
    });
});
