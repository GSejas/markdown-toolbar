# 🧪 Testing Strategy & Implementation

## Executive Summary

This document outlines the comprehensive testing strategy for the Markdown Extended Toolbar VS Code extension. The testing approach covers unit testing, integration testing, end-to-end testing, and performance testing to ensure code quality, reliability, and security.

## 🎯 Testing Objectives

### Primary Testing Goals
1. **Code Quality**: Ensure all code meets quality standards
2. **Functionality**: Verify all features work as expected
3. **Reliability**: Prevent regressions and ensure stability
4. **Security**: Validate security controls and prevent vulnerabilities
5. **Performance**: Ensure responsive and efficient operation
6. **Compatibility**: Verify cross-platform and VS Code version compatibility

### Testing Principles
- **Test-Driven Development**: Write tests before implementing features
- **Continuous Integration**: Automated testing on every commit
- **Comprehensive Coverage**: Aim for >90% code coverage
- **Realistic Scenarios**: Test with real-world use cases
- **Fast Feedback**: Quick test execution for rapid development

## 🏗️ Testing Architecture

### Testing Framework Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                    Testing Framework Stack                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Vitest        │  │   VS Code Test  │  │  Playwright │ │
│  │   (Unit Tests)  │  │   Framework     │  │  (E2E)      │ │
│  │                 │  │   (Integration) │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Istanbul      │  │   Mocha         │  │  Jest       │ │
│  │   (Coverage)    │  │   (Runner)      │  │  (Utils)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Test Categories
1. **Unit Tests**: Individual function/component testing
2. **Integration Tests**: Component interaction testing
3. **End-to-End Tests**: Full user workflow testing
4. **Performance Tests**: Speed and resource usage testing
5. **Security Tests**: Vulnerability and security control testing

## 🧪 Unit Testing

### Test Structure

```text
src/
├── commands/
│   ├── HeaderCommands.test.ts
│   ├── TableCommands.test.ts
│   └── CommandFactory.test.ts
├── providers/
│   ├── HeaderCodeLensProvider.test.ts
│   ├── MermaidCodeLensProvider.test.ts
│   └── StatusBarProvider.test.ts
├── services/
│   ├── ContextDetector.test.ts
│   ├── MarkdownFormatter.test.ts
│   └── Logger.test.ts
└── utils/
    ├── Parser.test.ts
    └── Validator.test.ts
```

### Unit Test Examples

#### Command Testing

```typescript
// HeaderCommands.test.ts
import { describe, it, expect, vi } from 'vitest';
import { HeaderCommands } from '../commands/HeaderCommands';
import * as vscode from 'vscode';

describe('HeaderCommands', () => {
  it('should promote header level correctly', async () => {
    // Mock VS Code API
    const mockEditor = {
      document: { uri: vscode.Uri.parse('file:///test.md') },
      selection: new vscode.Selection(0, 0, 0, 10),
      edit: vi.fn()
    };

    vi.spyOn(vscode.window, 'activeTextEditor', 'get')
      .mockReturnValue(mockEditor as any);

    // Execute command
    await HeaderCommands.promoteHeader();

    // Verify edit was called with correct arguments
    expect(mockEditor.edit).toHaveBeenCalledWith(
      expect.any(Function),
      { undoStopBefore: false, undoStopAfter: true }
    );
  });
});
```

#### Provider Testing

```typescript
// HeaderCodeLensProvider.test.ts
describe('HeaderCodeLensProvider', () => {
  it('should create CodeLens for headers', () => {
    const provider = new HeaderCodeLensProvider();
    const document = createMockDocument('# Header 1\n## Header 2');

    const codeLenses = provider.provideCodeLenses(document);

    expect(codeLenses).toHaveLength(2);
    expect(codeLenses[0].command?.command).toBe('markdownToolbar.header.promote');
    expect(codeLenses[1].command?.command).toBe('markdownToolbar.header.demote');
  });
});
```

### Mocking Strategy

```typescript
// mocks/vscode.ts
export const mockVSCode = {
  window: {
    activeTextEditor: undefined,
    showQuickPick: vi.fn(),
    showInformationMessage: vi.fn()
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn()
    }))
  },
  commands: {
    executeCommand: vi.fn(),
    registerCommand: vi.fn()
  }
};
```

## 🔗 Integration Testing

### Integration Test Scenarios
1. **Command Execution Flow**
2. **Provider Registration**
3. **Status Bar Updates**
4. **External Extension Integration**
5. **Configuration Changes**

#### Integration Test Example

```typescript
// integration/extension-integration.test.ts
describe('Extension Integration', () => {
  it('should register all commands on activation', async () => {
    const context = createMockExtensionContext();
    const extension = new MarkdownToolbarExtension();

    await extension.activate(context);

    // Verify command registrations
    expect(vscode.commands.registerCommand)
      .toHaveBeenCalledWith('markdownToolbar.header.promote', expect.any(Function));
    expect(vscode.commands.registerCommand)
      .toHaveBeenCalledWith('markdownToolbar.table.insert', expect.any(Function));
  });

  it('should update status bar on document change', async () => {
    // Setup
    const provider = new StatusBarProvider();
    const document = createMockDocument('# Test Header');

    // Trigger document change
    await vscode.workspace.onDidChangeTextDocument.emit({
      document,
      contentChanges: []
    });

    // Verify status bar update
    expect(provider.updateStatusBar).toHaveBeenCalledWith(document);
  });
});
```

## 🌐 End-to-End Testing

### E2E Test Scenarios
1. **Header Manipulation**
2. **Table Creation and Editing**
3. **CodeLens Interaction**
4. **Status Bar Functionality**
5. **Settings Configuration**

#### E2E Test Example

```typescript
// e2e/markdown-editing.test.ts
describe('Markdown Editing E2E', () => {
  it('should promote header using CodeLens', async () => {
    // Open markdown file
    await vscode.commands.executeCommand('vscode.open', testFileUri);

    // Wait for CodeLens to appear
    await waitForCodeLens();

    // Click CodeLens
    await clickCodeLens('promote');

    // Verify document content
    const document = vscode.window.activeTextEditor?.document;
    expect(document?.getText()).toContain('## Promoted Header');
  });

  it('should create table via status bar', async () => {
    // Activate extension
    await activateExtension();

    // Click status bar item
    await clickStatusBarItem('Insert Table');

    // Fill table dialog
    await fillQuickPick({ rows: 3, columns: 2 });

    // Verify table insertion
    const document = vscode.window.activeTextEditor?.document;
    expect(document?.getText()).toContain('| Header 1 | Header 2 |');
  });
});
```

## 📊 Test Coverage

### Coverage Requirements
- **Unit Tests**: >90% statement coverage
- **Integration Tests**: >85% branch coverage
- **Critical Paths**: 100% coverage
- **Error Handling**: All error paths tested

### Coverage Report Structure

```json
{
  "coverage": {
    "commands/": {
      "statements": 95.2,
      "branches": 89.7,
      "functions": 100,
      "lines": 94.8
    },
    "providers/": {
      "statements": 92.1,
      "branches": 87.3,
      "functions": 95.5,
      "lines": 91.7
    },
    "services/": {
      "statements": 88.9,
      "branches": 82.4,
      "functions": 90.2,
      "lines": 87.6
    }
  }
}
```

## 🚀 Continuous Integration

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Generate coverage report
      run: npm run coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Quality Gates
- **Unit Tests**: Must pass on all platforms
- **Coverage**: >90% overall coverage
- **Linting**: No linting errors
- **Type Checking**: No TypeScript errors
- **Security**: No security vulnerabilities

## 🔒 Security Testing

### Security Test Categories
1. **Input Validation Testing**
2. **Command Injection Testing**
3. **Access Control Testing**
4. **Data Sanitization Testing**

#### Security Test Example

```typescript
// security/command-injection.test.ts
describe('Command Injection Security', () => {
  it('should reject malicious command arguments', async () => {
    const maliciousArgs = [
      { __proto__: { toString: () => 'malicious' } },
      '<script>alert("xss")</script>',
      '../../../etc/passwd'
    ];

    for (const arg of maliciousArgs) {
      await expect(executeCommand('markdownToolbar.test', [arg]))
        .rejects.toThrow('Invalid command arguments');
    }
  });

  it('should sanitize markdown content', () => {
    const maliciousMarkdown = '# Header<script>alert("xss")</script>';
    const sanitized = sanitizeMarkdown(maliciousMarkdown);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('# Header');
  });
});
```

## ⚡ Performance Testing

### Performance Test Scenarios
1. **Large Document Handling**
2. **Rapid Command Execution**
3. **Memory Usage Monitoring**
4. **CodeLens Generation Speed**

#### Performance Test Example

```typescript
// performance/large-document.test.ts
describe('Large Document Performance', () => {
  it('should handle 10k line document within time limit', async () => {
    const largeDocument = createLargeMarkdownDocument(10000);
    const provider = new HeaderCodeLensProvider();

    const startTime = performance.now();
    const codeLenses = provider.provideCodeLenses(largeDocument);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(500); // 500ms limit
    expect(codeLenses.length).toBeGreaterThan(100);
  });

  it('should not leak memory during repeated operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform 100 operations
    for (let i = 0; i < 100; i++) {
      await executeCommand('markdownToolbar.header.promote');
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB limit
  });
});
```

## 🐛 Test Debugging & Troubleshooting

### Common Test Issues
1. **VS Code API Mocking**
2. **Async Operation Timing**
3. **Extension Context Setup**
4. **File System Operations**

### Debugging Strategies

```typescript
// Debug test setup
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Setup fresh VS Code mocks
  mockVSCodeAPI();

  // Enable debug logging
  process.env.DEBUG = 'true';
});

// Debug async operations
it('should handle async command execution', async () => {
  const promise = executeCommand('test.command');

  // Advance timers if using fake timers
  vi.advanceTimersByTime(100);

  const result = await promise;
  expect(result).toBeDefined();
});
```

## 📈 Test Metrics & Reporting

### Test Metrics Dashboard
- **Test Execution Time**: Average and trend
- **Coverage Trends**: Daily coverage reports
- **Failure Analysis**: Common failure patterns
- **Performance Benchmarks**: Speed and memory metrics

### Test Report Structure

```json
{
  "summary": {
    "total": 245,
    "passed": 238,
    "failed": 7,
    "skipped": 0,
    "duration": "45.2s"
  },
  "coverage": {
    "statements": 92.4,
    "branches": 88.1,
    "functions": 95.2,
    "lines": 91.8
  },
  "failures": [
    {
      "test": "HeaderCommands.promoteHeader",
      "error": "VS Code API not mocked",
      "stack": "..."
    }
  ]
}
```

## 🔄 Test Maintenance

### Test Maintenance Tasks
1. **Regular Review**: Monthly test suite review
2. **Flaky Test Management**: Identify and fix unreliable tests
3. **Test Data Updates**: Keep test data current
4. **Dependency Updates**: Update test dependencies

### Test Organization

```text
test/
├── fixtures/          # Test data files
├── helpers/           # Test utility functions
├── mocks/            # Mock implementations
├── utils/            # Test configuration
└── reports/          # Generated test reports
```

## 🎯 Future Testing Enhancements

### Short Term (Next Release)
- [ ] Add visual regression testing
- [ ] Implement mutation testing
- [ ] Add accessibility testing
- [ ] Enhance performance benchmarking

### Medium Term (Q1 2026)
- [ ] AI-powered test generation
- [ ] Advanced mocking framework
- [ ] Cross-extension integration testing
- [ ] Automated security testing

### Long Term (2026+)
- [ ] Machine learning test prioritization
- [ ] Predictive failure analysis
- [ ] Automated test maintenance
- [ ] Real-world usage simulation

## 📋 Testing Checklist

### Pre-Release Testing
- [ ] All unit tests passing
- [ ] Integration tests successful
- [ ] E2E tests verified
- [ ] Performance benchmarks met
- [ ] Security tests completed
- [ ] Cross-platform testing done
- [ ] Coverage requirements satisfied

### Release Testing Validation
- [ ] CI pipeline successful
- [ ] No critical test failures
- [ ] Coverage reports generated
- [ ] Performance metrics collected
- [ ] Security scan completed
- [ ] Manual testing checklist completed

---

**Document Version**: 2.0.0
**Last Updated**: September 2, 2025
**Test Framework**: Vitest 1.0.0
**Coverage Tool**: Istanbul 2.0.0
**Author**: Testing Team
**Classification**: Internal Use Only
