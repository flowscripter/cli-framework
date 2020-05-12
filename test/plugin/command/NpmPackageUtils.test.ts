import { promises as fs, constants } from 'fs';
import mockFs from 'mock-fs';
import axios from 'axios';
import tar from 'tar-fs';
import {
    getInstalledPackages,
    resolvePackageSpec,
    installPackage,
    uninstallPackage
} from '../../../src/plugin/command/NpmPackageUtils';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const packumentA = {
    name: '@foo/a',
    'dist-tags': {
        latest: '1.0.0'
    },
    versions: {
        '1.0.0': {
            name: '@foo/a',
            version: '1.0.0',
            dependencies: {
                f: '2.0.0'
            },
            dist: {
                tarball: 'registry/@foo/a/a-1.0.0.tgz'
            }
        }
    }
};

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
                '@foo': {
                    a: {
                        'package.json': JSON.stringify({
                            name: '@foo/a',
                            version: '1.0.0',
                            dependencies: {
                                c: '3.0.0'
                            }
                        })
                    }
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
                z: 'foo'
            },
            '/fixtureD': {
                package: {
                    '@foo': {
                        d: {
                            'package.json': JSON.stringify({
                                name: '@foo/d',
                                version: '1.0.0'
                            })
                        }
                    }
                }
            },
            '/fixtureE': {
                package: {
                    e: {
                        'package.json': JSON.stringify({
                            name: 'e',
                            version: '5.0.0',
                            dependencies: {
                                f: '6.0.0'
                            }
                        })
                    }
                }
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    test('getInstalledPackages', async () => {
        const installed = await getInstalledPackages('/location');
        expect(installed).toEqual([
            { name: '@foo/a', version: '1.0.0' },
            { name: 'b', version: '2.0.0' }
        ]);
    });

    test('resolvePackageSpec success', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentA }));

        let packageSpec = await resolvePackageSpec('registry', { name: '@foo/a', version: '1.0.0' });
        expect(packageSpec).toEqual({ name: '@foo/a', version: '1.0.0', tarballUri: 'registry/@foo/a/a-1.0.0.tgz' });

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));

        packageSpec = await resolvePackageSpec('registry', { name: 'e', version: '5.0.0' });
        expect(packageSpec).toEqual({ name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' });

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));

        packageSpec = await resolvePackageSpec('registry', { name: 'e' });
        expect(packageSpec).toEqual({ name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' });

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentE }));

        packageSpec = await resolvePackageSpec('registry', { name: 'e', version: '^5.0.0' });
        expect(packageSpec).toEqual({ name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' });
    });

    test('resolvePackageSpec failure with invalid packument', async () => {
        const brokenPackage = packumentE;
        brokenPackage['dist-tags'].latest = '6.0.0';

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: brokenPackage }));

        await expect(resolvePackageSpec('registry', { name: 'e' })).rejects.toThrowError();
    });

    test('resolvePackageSpec failure with invalid version', async () => {
        const brokenPackage = packumentE;
        brokenPackage['dist-tags'].latest = 'foo';

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: brokenPackage }));

        await expect(resolvePackageSpec('registry', { name: 'e' })).rejects.toThrowError();
    });

    test('resolvePackageSpec with packument get failure', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.reject(new Error('fail')));

        await expect(resolvePackageSpec('registry', { name: 'e', version: '5.0.0' })).rejects.toThrowError();
    });

    test('resolvePackageSpec failure if no dist-tag latest when version unspecified', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: packumentZ }));

        await expect(resolvePackageSpec('registry', { name: 'g' })).rejects.toThrowError();
    });

    test('installPackage success', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/fixtureD') }));

        await expect(fs.access('/location/@foo/d', constants.F_OK)).rejects.toThrowError();
        await installPackage('/location', {
            name: '@foo/d', version: '1.0.0', tarballUri: 'registry/@foo/d/d-1.0.0.tgz'
        });
        await fs.access('/location/@foo/d', constants.F_OK);

        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/fixtureE') }));

        await expect(fs.access('/location/e', constants.F_OK)).rejects.toThrowError();
        await installPackage('/location', { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' });
        await fs.access('/location/e', constants.F_OK);
    });

    test('installPackage failure if folder exists', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/fixtureE') }));

        await fs.mkdir('/location/e');
        await fs.access('/location/e', constants.F_OK);
        await expect(installPackage('/location',
            { name: 'e', version: '5.0.0', tarballUri: 'registry/e/e-5.0.0.tgz' })).rejects.toThrowError();
    });

    test('installPackage failure if no tarballUri specified', async () => {
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: tar.pack('/fixtureE') }));

        await expect(installPackage('/location', { name: 'e', version: '5.0.0' })).rejects.toThrowError();
    });

    test('uninstallPackage success', async () => {
        await fs.access('/location/@foo/a', constants.F_OK);
        await uninstallPackage('/location', { name: '@foo/a', version: '1.0.0' });
        await expect(fs.access('/location/@foo/a', constants.F_OK)).rejects.toThrowError();

        await fs.access('/location/b', constants.F_OK);
        await uninstallPackage('/location', { name: 'b', version: '2.0.0' });
        await expect(fs.access('/location/b', constants.F_OK)).rejects.toThrowError();
    });

    test('uninstallPackage failure if version not specified', async () => {
        await fs.access('/location/b', constants.F_OK);
        await expect(uninstallPackage('/location', { name: 'b' })).rejects.toThrowError();
    });

    test('uninstallPackage failure if file not folder exists', async () => {
        await expect(uninstallPackage('/location', { name: 'z', version: '1.0.0' })).rejects.toThrowError();
    });

    test('uninstallPackage failure if no package.json exists', async () => {
        await fs.unlink('/location/b/package.json');
        await expect(uninstallPackage('/location', { name: 'b', version: '1.0.0' })).rejects.toThrowError();
    });
});
