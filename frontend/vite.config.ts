import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            plugins: [],
        },
        minify: true,
        sourcemap: true,
    },
    resolve: {
        alias: {
            stream: "stream-browserify",
        },
    },
    server: {
        port: 3000,
        strictPort: true,
    },
});
