module.exports = {
    moduleFileExtensions: [
        'js',
        'ts'
    ],
    testEnvironment: 'node',
    testMatch: [
        '**/?(*.)test.ts'
    ],
    transform: {
        '\\.(j|t)s$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@flowscripter)/)'
    ],
    modulePaths: [
        'src'
    ],
    coverageReporters: [
        'lcov'
    ],
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    coverageDirectory: 'reports',
    setupFiles: ['./jest.env.js'],
    globals: {
        'ts-jest': {
            babelConfig: {
                plugins: ['transform-es2015-modules-commonjs']
            }
        }
    }
};
