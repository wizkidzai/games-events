import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Monorepo root Vite config — individual games have their own vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          phaser: ['phaser'],
        },
      },
    },
  },
});
