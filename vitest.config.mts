import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            src: fileURLToPath(new URL('./src', import.meta.url)),
            // The real `obsidian` package only ships type declarations; tests use a minimal stub.
            obsidian: fileURLToPath(new URL('./test/obsidian-stub.ts', import.meta.url)),
        },
    },
    test: {
        include: ['test/**/*.test.ts'],
    },
});
