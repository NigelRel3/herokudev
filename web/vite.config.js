"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const vite_1 = require("vite");
const plugin_vue_1 = require("@vitejs/plugin-vue");
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_vue_1.default)()],
    resolve: {
        alias: {
            '@': (0, url_1.fileURLToPath)(new url_1.URL('./src', import.meta.url)),
        }
    },
    build: {
        outDir: '../dist-web',
        minify: false,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    }
});
//# sourceMappingURL=vite.config.js.map