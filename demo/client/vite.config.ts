import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths';
import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react'

export default defineConfig({
    root: '.',
    build: {
        target: 'esnext',
        outDir: path.resolve(__dirname, "dist"),
    },
    server: {
        hmr: false,
        fs: {
            allow: ['..','../..','../../..']
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "../shared/src"),
        },
    },
    plugins: [glsl(), react()],
    optimizeDeps: {
        exclude: ['@bokuweb/zstd-wasm'],
        esbuildOptions: {
            target: 'esnext',
        },
    },
});