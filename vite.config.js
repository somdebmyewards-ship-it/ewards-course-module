import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({ input: ['resources/js/main.tsx'], refresh: true }),
        react(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    resolve: { alias: { '@': '/resources/js' } },
    build: {
        target: 'es2020',
        cssMinify: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-router-dom') || /[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
                            return 'vendor-react';
                        }
                        if (id.includes('antd') || id.includes('@ant-design/icons')) {
                            return 'vendor-antd';
                        }
                        if (id.includes('axios')) {
                            return 'vendor-axios';
                        }
                    }
                },
            },
        },
    },
});
