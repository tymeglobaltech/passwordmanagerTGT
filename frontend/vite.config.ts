import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function resolveXlsx(): string {
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/xlsx'),
    path.resolve(process.cwd(), '../node_modules/xlsx'),
    path.resolve(process.cwd(), '../../node_modules/xlsx'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? 'xlsx';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      xlsx: resolveXlsx(),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
