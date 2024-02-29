import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        environment: 'jsdom',
        browser: {
            enabled: false,
            provider: 'playwright',
            name: 'chromium',
        },
    },
})