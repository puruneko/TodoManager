import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    assetsInclude: ["./*.md"],
    test: {
        globals: false,
        environment: "jsdom",
        setupFiles: ["./vitest-setup.ts"],
        coverage: {
            include: ["src"],
            exclude: ["src/main.tsx"],
        },
    },
})
