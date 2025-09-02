import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/unit/**/*.test.ts'],
        exclude: [
            'test/unit/**/vscode-*.test.ts' // Exclude VS Code API dependent tests
        ],
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reportsDirectory: 'coverage',
            reporter: ['text', 'lcov'],
            thresholds: {
                statements: 75,
                branches: 65,
                lines: 75,
                functions: 70
            }
        }
    }
});
