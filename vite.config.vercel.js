import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Standalone Vite config for Vercel deployment (SPA mode).
 * Usage: npx vite build --config vite.config.vercel.js
 */
export default defineConfig({
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    resolve: {
        alias: { '@': path.resolve(__dirname, 'resources/js') },
    },
    build: {
        target: 'es2020',
        cssMinify: true,
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html',
        },
    },
});
