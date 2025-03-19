// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/cjs/index.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/esm/index.js',
        format: 'esm',
        sourcemap: true,
        inlineDynamicImports: true,
      }
    ],
    plugins: [
      json(),
      peerDepsExternal(),
      alias({
        entries: [
          { find: 'perf_hooks', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'crypto', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'os', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'fs', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'stream', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'net', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'tls', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') },
          { find: 'path', replacement: pathResolve(__dirname, 'src/mock-node-modules.js') }
        ]
      }),
      replace({
        preventAssignment: true,
        values: {
          'use client': '',
          'use server': '',
          'process.env.NODE_ENV': JSON.stringify('production'),
          'import net from "net"': 'import { net } from "./src/mock-node-modules.js"',
          'import tls from "tls"': 'import { tls } from "./src/mock-node-modules.js"',
          'import crypto from "crypto"': 'import { crypto } from "./src/mock-node-modules.js"',
          'import * as stream from "stream"': 'import { stream } from "./src/mock-node-modules.js"',
          'import { performance } from "perf_hooks"': 'import { performance } from "./src/mock-node-modules.js"',
          'require("perf_hooks")': '{"performance": { now: () => Date.now() }}'
        }
      }),
      resolve({
        preferBuiltins: false,
        browser: true,
      }),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto'
      }),
      typescript({ 
        tsconfig: './tsconfig.json',
        noEmit: false,
        noEmitOnError: false
      }),
    ],
    external: [
      'react', 
      'react-dom',
      'next',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'ethers',
      'next-intl',
      'react-hook-form',
      'viem',
      'zod',
      '@hookform/resolvers',
      '@radix-ui/react-slot',
      /^@radix-ui\/.*/
    ],
  }
];