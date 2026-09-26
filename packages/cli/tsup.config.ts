import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  external: ['jiti'],
  platform: 'node',
  target: 'node18',
  clean: true,
  sourcemap: true,
  splitting: false,
  shims: false,
});
