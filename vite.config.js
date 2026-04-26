import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({ input: ['resources/js/main.tsx'], refresh: true }),
        react(),
    ],
    resolve: { alias: { '@': '/resources/js' } },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        cors: true,
        hmr: { host: 'localhost' },
        origin: 'http://localhost:5173',
    },
    build: {
        target: 'es2020',
        cssMinify: true,
    },
});
