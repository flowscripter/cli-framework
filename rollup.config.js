import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';
import { eslint } from 'rollup-plugin-eslint';
import json from 'rollup-plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';
import tempDir from 'temp-dir';

module.exports = [
    {
        input: {
            node: 'src/index.ts'
        },
        output: {
            dir: 'dist',
            format: 'es',
            sourcemap: true
        },
        watch: {
            include: 'src/**',
        },
        external: [
            'path',
            'fs',
            'crypto',
            'util',
            'tty',
            'os',
            'console',
            'readline',
            'stream',
            'assert',
            'events'
        ],
        plugins: [
            peerDepsExternal(),
            eslint({
                include: [
                    'src/**/*.ts'
                ]
            }),
            typescript({
                typescript: ts,
                useTsconfigDeclarationDir: true,
                cacheRoot: `${tempDir}/.rpt2_cache`
            }),
            json(),
            commonjs(),
            resolve(),
            cleanup({
                extensions: ['ts']
            })
        ]
    }
];
