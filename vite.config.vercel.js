import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Standalone Vite config for Vercel deployment (SPA mode).
 * Builds the React frontend independently of Laravel.
 *
 * Usage: npx vite build --config vite.config.vercel.js
 */
export default defineConfig({
    plugins: [react()],
    root: '.',
    publicDir: false, // Don't copy Laravel's public/ folder
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
    define: {
        // Ensure import.meta.env works in production
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api'),
    },
});
