import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react.tsx',
    'src/next.tsx',
    'src/next-client.tsx',
    'src/pages.ts',
    'src/pages-provider.tsx',
    'src/locale-path.ts',
  ],
  format: ['esm', 'cjs'],
  external: ['./next-client.js', './pages-provider.js'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
