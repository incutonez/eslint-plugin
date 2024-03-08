import {defineConfig} from "vitest/dist/config";

export default defineConfig({
    test: {
        exclude: [],
        include: ["./tests/**/*.test.ts"],
        setupFiles: ["./tests/setup.ts"]
    },
})
