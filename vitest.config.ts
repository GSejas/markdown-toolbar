import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/unit/**/*.test.ts'],
        exclude: [
            'test/unit/**/vscode-*.test.ts' // Exclude VS Code API dependent tests
        ],
        globals: true,
        environment: 'node',
        alias: {
            vscode: new URL('./test/utils/vscode-mock.ts', import.meta.url).pathname
        },
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
