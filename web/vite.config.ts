import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, './src/components'),
      pages: path.resolve(__dirname, './src/pages'),
      types: path.resolve(__dirname, './src/types'),
      services: path.resolve(__dirname, './src/services'),
      hooks: path.resolve(__dirname, './src/hooks'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'gama',
      'gamaserver',
      'gama.novasc.local',
      'gamaserver.novasc.local'
    ]
  },
});
