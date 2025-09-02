# Testing Strategy: Unit Tests, Mocking, and Quality Assurance

## Overview

Building a robust VS Code extension requires a comprehensive testing strategy that balances speed, reliability, and maintainability. This article explores the testing approach used in the markdown toolbar extension, including unit testing with Vitest, mocking strategies, and quality assurance practices.

## Testing Architecture

### Test Pyramid Structure

The extension follows a test pyramid with emphasis on fast, reliable unit tests:

```text
                 ┌─────────────────┐
                 │   Integration   │ ← VS Code API testing
                 │     Tests       │   (slower, fewer)
                 └─────────────────┘
               ┌───────────────────────┐
               │     Component        │ ← StatusBarManager, 
               │      Tests          │   CommandRegistry
               └───────────────────────┘
           ┌─────────────────────────────────┐
           │         Unit Tests              │ ← MarkdownFormatter,
           │     (Pure Logic)                │   ContextDetector
           └─────────────────────────────────┘
```

### Test Configuration

#### Vitest Setup (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    exclude: ['test/unit/**/vscode-*.test.ts'], // Exclude VS Code API dependent tests
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
```

#### Test Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "node ./dist/test/runTest.js",
    "test:cov": "vitest run --coverage"
  }
}
```

## Unit Testing Strategy

### Pure Logic Testing

The separation of business logic from VS Code APIs enables comprehensive unit testing:

```typescript
// test/unit/engine/MarkdownFormatter.test.ts
describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('Bold Formatting', () => {
    it('should wrap selected text with bold markers', () => {
      const result = formatter.formatBold('hello world', 0, 11);
      expect(result.text).toBe('**hello world**');
      expect(result.selectionStart).toBe(2);
      expect(result.selectionEnd).toBe(13);
    });

    it('should detect and toggle existing bold formatting', () => {
      const result = formatter.formatBold('**hello world**', 2, 13);
      expect(result.text).toBe('hello world');
      expect(result.selectionStart).toBe(0);
      expect(result.selectionEnd).toBe(11);
    });
  });
});
```

### Test Fixtures and Utilities

#### Markdown Samples (`test/fixtures/markdown-samples.ts`)

```typescript
export const markdownSamples = {
  simple: 'Hello world',
  withBold: '**bold text** and normal text',
  withItalic: '*italic text* and normal text',
  withCode: '`code text` and normal text',
  withLinks: '[GitHub](https://github.com) is great',
  withLists: '- Item 1\n- Item 2\n- Item 3',
  numberedLists: '1. First item\n2. Second item\n3. Third item',
  mixedLists: '- Item 1\n1. Item 2\n- Item 3',
  nestedFormatting: '**bold with *italic* inside**',
  complexFormatting: '## Header\n\n**Bold** text with [link](url) and:\n- List item'
};

export const selectionScenarios = {
  noSelection: { start: 0, end: 0 },
  wordSelection: { start: 0, end: 5 },
  multiWordSelection: { start: 0, end: 11 },
  partialWordSelection: { start: 2, end: 8 },
  lineSelection: { start: 0, end: 15 },
  multiLineSelection: { start: 0, end: 25 }
};
```

#### Mock Utilities (`test/utils/vscode-mocks.ts`)

```typescript
import { vi } from 'vitest';

export const createMockEditor = (text: string = '') => {
  return {
    document: {
      getText: vi.fn().mockReturnValue(text),
      lineAt: vi.fn(),
      positionAt: vi.fn((offset: number) => ({ line: 0, character: offset })),
      offsetAt: vi.fn((position: any) => position.character),
      languageId: 'markdown'
    },
    selection: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 }
    },
    edit: vi.fn().mockResolvedValue(true)
  };
};

export const createMockWorkspaceConfiguration = (values: Record<string, any> = {}) => {
  return {
    get: vi.fn((key: string, defaultValue?: any) => {
      return values[key] !== undefined ? values[key] : defaultValue;
    }),
    update: vi.fn().mockResolvedValue(undefined),
    has: vi.fn((key: string) => key in values),
    inspect: vi.fn()
  };
};
```

## Mocking Strategy

### The Problem with Module Mocking

Initial attempts used Vitest's module mocking, but encountered issues:

```typescript
// ❌ Problematic approach - hoisting issues
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: mockGetConfiguration // ReferenceError: Cannot access before initialization
  }
}));
```

**Issues encountered:**
- Hoisting problems with mock factories
- Difficult to configure different behaviors per test
- Complex setup for dynamic mock values

### Solution: Dependency Injection

The solution was to refactor components to accept injected dependencies:

```typescript
// ✅ Clean approach - dependency injection
export class SettingsAdapter {
  constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
  }
}

// In tests:
const mockVscode = {
  workspace: {
    getConfiguration: vi.fn().mockReturnValue(mockConfig),
    onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
  },
  ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
};

const settings = new SettingsAdapter(mockVscode);
```

### Benefits of Dependency Injection

1. **No Hoisting Issues**: Mocks are plain objects created in test functions
2. **Test Isolation**: Each test gets fresh mock instances
3. **Easy Configuration**: Simple to set up different behaviors per test
4. **Type Safety**: TypeScript can validate mock object structure

## Advanced Testing Scenarios

### Edge Case Testing

Complex formatting logic requires comprehensive edge case coverage:

```typescript
describe('Bold Formatting Edge Cases', () => {
  it('should handle partial bold selection creating union', () => {
    const result = formatter.formatBold('**hello** world', 5, 15);
    expect(result.text).toBe('**hello world**');
    expect(result.selectionStart).toBe(2);
    expect(result.selectionEnd).toBe(13);
  });

  it('should remove bold when selection covers full range including markers', () => {
    const result = formatter.formatBold('**hello**', 0, 9);
    expect(result.text).toBe('hello');
    expect(result.selectionStart).toBe(0);
    expect(result.selectionEnd).toBe(5);
  });

  it('should toggle off when cursor positioned inside bold text', () => {
    const result = formatter.formatBold('**hello**', 4, 4);
    expect(result.text).toBe('hello');
  });
});
```

### Context Detection Testing

Testing regex-based context detection with various scenarios:

```typescript
describe('ContextDetector', () => {
  let detector: ContextDetector;

  beforeEach(() => {
    detector = new ContextDetector();
  });

  describe('Nested Formatting Detection', () => {
    it('should detect both bold and italic in nested text', () => {
      const context = detector.detectContext('**bold *italic* text**', 10);
      expect(context.isBold).toBe(true);
      expect(context.isItalic).toBe(true);
    });

    it('should not confuse italic and bold markers', () => {
      const context = detector.detectContext('**bold text**', 5);
      expect(context.isBold).toBe(true);
      expect(context.isItalic).toBe(false);
    });
  });

  describe('Link Context Extraction', () => {
    it('should extract link text and URL correctly', () => {
      const context = detector.detectContext('[GitHub](https://github.com)', 3);
      expect(context.isLink).toBe(true);
      expect(context.linkText).toBe('GitHub');
      expect(context.linkUrl).toBe('https://github.com');
    });
  });
});
```

### Settings Adapter Testing

Testing configuration management with injected mock VS Code:

```typescript
describe('SettingsAdapter', () => {
  let settings: SettingsAdapter;
  let mockConfig: any;
  let mockVscode: any;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined)
    };

    mockVscode = {
      workspace: {
        getConfiguration: vi.fn().mockReturnValue(mockConfig),
        onDidChangeConfiguration: vi.fn()
      },
      ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
    };

    settings = new SettingsAdapter(mockVscode);
  });

  it('should return default value when setting is undefined', () => {
    mockConfig.get.mockReturnValue(undefined);
    const result = settings.isToolbarEnabled();
    expect(result).toBe(true);
    expect(mockConfig.get).toHaveBeenCalledWith('enabled', true);
  });

  it('should return configured value when setting exists', () => {
    mockConfig.get.mockReturnValue(false);
    const result = settings.isToolbarEnabled();
    expect(result).toBe(false);
  });
});
```

## Integration Testing

### VS Code Extension Testing

While unit tests cover business logic, integration tests verify VS Code API integration:

```typescript
// test/integration/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import { getExtensionState } from '../../src/extension';

suite('Extension Integration Tests', () => {
  test('Extension should activate on markdown files', async () => {
    // Create a markdown document
    const doc = await vscode.workspace.openTextDocument({
      content: '# Test Markdown',
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc);
    
    // Verify extension state
    const state = getExtensionState();
    assert.ok(state.statusBarManager);
    assert.ok(state.commandRegistry);
    
    // Verify status bar visibility
    assert.strictEqual(state.statusBarManager.getVisibility(), true);
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('markdownToolbar.bold'));
    assert.ok(commands.includes('markdownToolbar.italic'));
    assert.ok(commands.includes('markdownToolbar.code'));
    assert.ok(commands.includes('markdownToolbar.link'));
    assert.ok(commands.includes('markdownToolbar.list'));
  });
});
```

### Test Runner Configuration

```typescript
// test/runTest.ts
import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'] // Disable other extensions for isolated testing
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
```

## Coverage and Quality Metrics

### Coverage Thresholds

Setting realistic but meaningful coverage targets:

```typescript
coverage: {
  thresholds: {
    statements: 75,  // 75% of statements executed
    branches: 65,    // 65% of conditional branches taken
    lines: 75,       // 75% of lines covered
    functions: 70    // 70% of functions called
  }
}
```

**Rationale:**
- **Statements (75%)**: High coverage for main execution paths
- **Branches (65%)**: Lower target acknowledging complex edge cases
- **Lines (75%)**: Similar to statements for consistency
- **Functions (70%)**: Ensures most public APIs are tested

### Quality Gates

Tests run as part of CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run lint
  run: npm run lint

- name: Run type check  
  run: npm run check-types

- name: Run unit tests
  run: npm run test:unit

- name: Run unit tests with coverage
  run: npm run test:cov

- name: Run integration tests
  run: xvfb-run -a npm run test:integration
```

## Performance Testing

### Benchmark Tests

While not implemented in this project, performance testing would focus on:

```typescript
describe('Performance Benchmarks', () => {
  it('should format large documents efficiently', () => {
    const largeText = 'word '.repeat(10000);
    const start = performance.now();
    
    formatter.formatBold(largeText, 0, largeText.length);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Less than 100ms
  });

  it('should detect context in documents with many formatting marks', () => {
    const complexText = '**bold** *italic* `code` '.repeat(1000);
    const start = performance.now();
    
    detector.detectContext(complexText, complexText.length / 2);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Less than 50ms
  });
});
```

## Test Organization

### File Structure

```text
test/
├── fixtures/
│   ├── markdown-samples.ts     # Test data
│   └── selection-scenarios.ts  # Common selection patterns
├── unit/
│   ├── engine/
│   │   ├── MarkdownFormatter.test.ts
│   │   └── ContextDetector.test.ts
│   ├── settings/
│   │   └── SettingsAdapter.test.ts
│   └── ui/
│       └── StatusBarManager.test.ts
├── integration/
│   ├── extension.test.ts       # Full extension tests
│   └── commands.test.ts        # Command execution tests
└── utils/
    ├── vscode-mocks.ts         # Mock utilities
    └── test-helpers.ts         # Common test functions
```

### Naming Conventions

- **Test files**: `*.test.ts` suffix
- **Mock files**: `*-mocks.ts` suffix  
- **Fixture files**: `*-samples.ts` or `*-fixtures.ts`
- **Utility files**: `*-helpers.ts` or `*-utils.ts`

## Debugging Tests

### VS Code Test Debugging

Configuration for debugging tests in VS Code:

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Unit Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Integration Tests", 
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}", "--extensionTestsPath=${workspaceFolder}/dist/test"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Test Output and Logging

Structured test output for debugging:

```typescript
describe('MarkdownFormatter', () => {
  it('should handle complex partial selection', () => {
    const input = '**hello** world';
    const selection = { start: 5, end: 15 };
    
    console.log(`Input: "${input}"`);
    console.log(`Selection: ${selection.start}-${selection.end} ("${input.substring(selection.start, selection.end)}")`);
    
    const result = formatter.formatBold(input, selection.start, selection.end);
    
    console.log(`Output: "${result.text}"`);
    console.log(`New selection: ${result.selectionStart}-${result.selectionEnd}`);
    
    expect(result.text).toBe('**hello world**');
  });
});
```

## Lessons Learned

### What Worked Well

1. **Dependency Injection**: Eliminated complex module mocking issues
2. **Pure Functions**: Made business logic highly testable
3. **Test Fixtures**: Realistic markdown samples caught edge cases
4. **Coverage Thresholds**: Balanced quality with development velocity

### What Could Be Improved

1. **Property-Based Testing**: Could generate random markdown samples for more comprehensive edge case discovery
2. **Visual Regression Tests**: Screenshot testing for status bar appearance
3. **Performance Monitoring**: Automated performance regression detection
4. **Cross-Platform Testing**: Different behavior on Windows/Mac/Linux

### Key Principles

1. **Test the Interface**: Focus on public APIs and expected behaviors
2. **Avoid Implementation Details**: Tests should survive refactoring
3. **Fast Feedback**: Unit tests should run in seconds, not minutes
4. **Realistic Scenarios**: Use real-world markdown samples in tests
5. **Clear Assertions**: Test failures should clearly indicate the problem

## Conclusion

A comprehensive testing strategy enabled confident development and refactoring throughout the project. Key takeaways:

1. **Architecture Enables Testing**: Clean separation of concerns makes testing straightforward
2. **Dependency Injection > Module Mocking**: Simpler, more reliable test setup
3. **Quality Gates**: Automated testing in CI/CD catches regressions early
4. **Coverage Balance**: High coverage for critical paths, realistic expectations for edge cases

The testing approach provides confidence in the extension's reliability while maintaining development velocity and code quality.
