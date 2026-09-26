import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react.tsx',
    'src/react-server.tsx',
    'src/request-state.ts',
    'src/project-config.ts',
    'src/next.tsx',
    'src/next-client.tsx',
    'src/pages.ts',
    'src/pages-provider.tsx',
    'src/locale-path.ts',
  ],
  format: ['esm', 'cjs'],
  external: [
    'jiti',
    './next-client.js',
    './pages-provider.js',
    './request-state.js',
    './project-config.js',
  ],
  shims: true,
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
