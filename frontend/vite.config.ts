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
        hmr: {
            // If the client must talk to the Vite server via a tunnel, use the following options:
            // protocol: "wss",
            // clientPort: 443,
            // port: 3000,
            // If the client can talk to the Vite server directly over localhost, use the following options:
            host: "localhost",
            protocol: "ws",
            clientPort: 3000,
            port: 3000,
        },
    },
});
