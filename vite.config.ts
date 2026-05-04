import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
    base,
    plugins: [
        preact(),
        tailwindcss(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'icons/**'],
            manifest: false,
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                cleanupOutdatedCaches: true,
            },
        }),
    ],
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        ]
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-codemirror': [
                        'codemirror',
                        '@codemirror/view',
                        '@codemirror/state',
                        '@codemirror/lang-markdown',
                        '@codemirror/theme-one-dark',
                        '@codemirror/commands',
                        '@codemirror/language',
                        '@codemirror/search',
                        '@uiw/codemirror-theme-github',
                    ],
                    'vendor-markdown': [
                        'markdown-it',
                        'markdown-it-task-lists',
                        'markdown-it-emoji',
                        'markdown-it-footnote',
                        'markdown-it-container',
                        'markdown-it-anchor',
                        'markdown-it-toc-done-right',
                        'markdown-it-texmath',
                        'gray-matter',
                    ],
                    'vendor-katex': ['katex'],
                    'vendor-hljs': ['highlight.js'],
                    'vendor-preact': ['preact', '@preact/signals'],
                    'vendor-lucide': ['lucide-react'],
                    'vendor-arena': ['partysocket'],
                },
            },
        },
    },
    worker: {
        format: 'es',
    },
});
