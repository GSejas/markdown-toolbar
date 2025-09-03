# Library Modernization & Architecture Enhancement Plan

## Overview
Comprehensive modernization of the Markdown Extended Toolbar extension using industry-standard libraries to improve performance, maintainability, and reliability.

## Phase 1: Core Library Integration (Priority: High)

### 1.1 Replace Custom Markdown Parsing with vscode-markdown-languageservice

**Goal:** Replace regex-based header parsing with Microsoft's official markdown language service

**Dependencies:**
```bash
npm install vscode-markdown-languageservice
```

**Implementation Tasks:**
- [ ] Create `src/engine/MarkdownLanguageServiceWrapper.ts`
- [ ] Implement language service initialization in extension activation
- [ ] Replace header parsing in `HeaderCodeLensProvider`
- [ ] Update document structure analysis to use `getDocumentSymbols()`
- [ ] Add error boundaries for language service calls

**API Integration Pattern:**
```typescript
// src/engine/MarkdownLanguageServiceWrapper.ts
import * as md from 'vscode-markdown-languageservice';
import * as vscode from 'vscode';

export class MarkdownLanguageServiceWrapper {
  private languageService: md.IMdLanguageService;

  constructor() {
    this.languageService = md.createLanguageService({
      workspace: this.createWorkspaceInterface(),
      parser: /* default or custom */,
      logger: this.createLoggerInterface()
    });
  }

  async getDocumentHeaders(document: vscode.TextDocument): Promise<HeaderInfo[]> {
    const symbols = await this.languageService.getDocumentSymbols(
      this.adaptTextDocument(document),
      { includeLinkDefinitions: false },
      { isCancellationRequested: false }
    );
    
    return symbols
      .filter(symbol => symbol.kind === 13) // SymbolKind.String for headers
      .map(symbol => this.convertSymbolToHeaderInfo(symbol));
  }
}
```

**Testing Strategy:**
- [ ] Unit tests for wrapper class
- [ ] Integration tests comparing old vs new parsing results
- [ ] Performance benchmarks on large markdown files

### 1.2 Implement Document Caching with quick-lru

**Goal:** Cache parsed document structures to improve performance

**Dependencies:**
```bash
npm install quick-lru @types/quick-lru
```

**Implementation Tasks:**
- [ ] Create `src/engine/DocumentCache.ts`
- [ ] Implement version-based cache invalidation
- [ ] Integrate with VS Code document change events
- [ ] Add cache statistics and monitoring

**API Integration Pattern:**
```typescript
// src/engine/DocumentCache.ts
import QuickLRU from 'quick-lru';
import * as vscode from 'vscode';

interface CachedDocument {
  version: number;
  headers: HeaderInfo[];
  lastParsed: Date;
}

export class DocumentCache {
  private cache = new QuickLRU<string, CachedDocument>({ maxSize: 100 });

  constructor() {
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this);
    vscode.workspace.onDidCloseTextDocument(this.onDocumentClosed, this);
  }

  getCachedHeaders(document: vscode.TextDocument): HeaderInfo[] | null {
    const key = this.getCacheKey(document);
    const cached = this.cache.get(key);
    
    if (cached && cached.version === document.version) {
      return cached.headers;
    }
    
    return null;
  }

  setCachedHeaders(document: vscode.TextDocument, headers: HeaderInfo[]): void {
    const key = this.getCacheKey(document);
    this.cache.set(key, {
      version: document.version,
      headers,
      lastParsed: new Date()
    });
  }

  private getCacheKey(document: vscode.TextDocument): string {
    return `${document.uri.toString()}-${document.version}`;
  }

  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    // Invalidate cache entries for the changed document
    const baseKey = event.document.uri.toString();
    for (const key of this.cache.keys()) {
      if (key.startsWith(baseKey)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 1.3 Dependency Injection with tsyringe

**Goal:** Replace manual singletons with proper dependency injection

**Dependencies:**
```bash
npm install tsyringe reflect-metadata
```

**Implementation Tasks:**
- [ ] Add reflect-metadata import to extension entry point
- [ ] Convert existing services to use `@injectable` decorators
- [ ] Update extension activation to use container registration
- [ ] Refactor providers and commands to use DI
- [ ] Update tests to use container for mocking

**Migration Pattern:**
```typescript
// Before: Manual singleton
// src/services/SomeService.ts
export class SomeService {
  private static instance: SomeService;
  static getInstance() { ... }
}

// After: tsyringe injectable
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class SomeService {
  // No more manual singleton logic
}

// Extension activation
import { container } from 'tsyringe';
import 'reflect-metadata';

export function activate(context: vscode.ExtensionContext) {
  // Services auto-register via @singleton decorator
  
  // Register providers with DI
  const headerProvider = container.resolve(HeaderCodeLensProvider);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider('markdown', headerProvider)
  );
}
```

## Phase 2: Enhanced Markdown Support (Priority: Medium)

### 2.1 Advanced Markdown Parsing with remark

**Goal:** Support GitHub Flavored Markdown and advanced parsing

**Dependencies:**
```bash
npm install remark remark-gfm remark-frontmatter remark-stringify @types/unist
```

**Implementation Tasks:**
- [ ] Create `src/engine/RemarkParser.ts` for advanced parsing
- [ ] Implement table detection for TableCodeLensProvider
- [ ] Add frontmatter parsing support
- [ ] Support for custom directive parsing

**API Integration Pattern:**
```typescript
// src/engine/RemarkParser.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import type { Root, Heading, Table, YAML } from 'mdast';

export class RemarkParser {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter);

  parseDocument(content: string): ParsedMarkdownDocument {
    const tree = this.processor.parse(content);
    const result: ParsedMarkdownDocument = {
      headers: [],
      tables: [],
      frontmatter: null
    };

    visit(tree, (node) => {
      switch (node.type) {
        case 'heading':
          result.headers.push(this.convertHeading(node as Heading));
          break;
        case 'table':
          result.tables.push(this.convertTable(node as Table));
          break;
        case 'yaml':
          result.frontmatter = this.parseFrontmatter(node as YAML);
          break;
      }
    });

    return result;
  }
}
```

## Phase 3: Error Handling & Reliability (Priority: High)

### 3.1 Comprehensive Error Boundaries

**Implementation Tasks:**
- [ ] Add error boundaries to all provider methods
- [ ] Implement graceful fallbacks for service failures
- [ ] Add error reporting and logging infrastructure
- [ ] Create error recovery mechanisms

**Error Boundary Pattern:**
```typescript
// src/utils/ErrorBoundary.ts
export function withErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  return operation().catch(error => {
    logger.error(`Error in ${context}:`, error);
    // Optional: Report to telemetry
    return fallback;
  });
}

// Usage in providers
async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
  return withErrorBoundary(
    () => this.doProvideCodeLenses(document),
    [], // fallback to empty array
    'HeaderCodeLensProvider.provideCodeLenses'
  );
}
```

## Phase 4: Testing Infrastructure (Priority: Medium)

### 4.1 Enhanced Testing Setup

**Dependencies:**
```bash
npm install --save-dev vitest @vitest/ui sinon ts-mockito
```

**Implementation Tasks:**
- [ ] Separate test configuration from build watchers
- [ ] Create comprehensive mock for vscode module
- [ ] Add integration tests for providers
- [ ] Performance benchmark tests
- [ ] Coverage reporting setup

**Test Structure:**
```
test/
├── unit/
│   ├── engine/
│   │   ├── MarkdownLanguageServiceWrapper.test.ts
│   │   ├── DocumentCache.test.ts
│   │   └── RemarkParser.test.ts
│   ├── providers/
│   └── services/
├── integration/
│   ├── extension.test.ts
│   └── providers/
├── fixtures/
│   ├── markdown-samples/
│   └── mocks/
└── performance/
    └── parsing.bench.ts
```

## Phase 5: Performance Monitoring (Priority: Low)

### 5.1 Performance Instrumentation

**Implementation Tasks:**
- [ ] Add timing hooks for critical operations
- [ ] Implement performance diagnostics commands
- [ ] Create performance regression tests
- [ ] Add memory usage monitoring

## Implementation Schedule

### Week 1: Phase 1.1 (vscode-markdown-languageservice)
- Days 1-2: Service wrapper implementation
- Days 3-4: HeaderCodeLensProvider migration
- Days 5-7: Testing and validation

### Week 2: Phase 1.2 (Document Caching)
- Days 1-2: Cache implementation
- Days 3-4: Integration with existing providers
- Days 5-7: Performance testing

### Week 3: Phase 1.3 (Dependency Injection)
- Days 1-3: Service conversion to DI
- Days 4-5: Provider updates
- Days 6-7: Test updates and validation

### Week 4: Phase 3.1 (Error Boundaries) + Testing
- Days 1-3: Error boundary implementation
- Days 4-7: Comprehensive testing setup

## Success Metrics

### Performance
- [ ] 50%+ reduction in document parsing time
- [ ] 90%+ cache hit rate for repeated document access
- [ ] <100ms response time for CodeLens generation

### Reliability
- [ ] Zero unhandled exceptions in providers
- [ ] Graceful degradation when services fail
- [ ] 99.9% provider method success rate

### Code Quality
- [ ] 80%+ test coverage
- [ ] All TSC strict mode compliance
- [ ] ESLint warnings < 10

## Migration Strategy

### Backwards Compatibility
- [ ] Maintain existing command IDs and configuration
- [ ] Preserve user settings during migration
- [ ] Gradual feature flag rollout

### Rollback Plan
- [ ] Feature flags for new parsing engine
- [ ] Ability to fallback to regex parsing
- [ ] Configuration option to disable caching

## Documentation Updates

- [ ] Update README with new architecture overview
- [ ] Create migration guide for contributors
- [ ] Update JSDoc headers across all modified files
- [ ] Create performance tuning guide

## Risk Assessment

### High Risk
- **vscode-markdown-languageservice integration**: Complex API, potential compatibility issues
- **Breaking changes**: DI conversion might affect existing functionality

### Medium Risk
- **Performance regression**: New parsing might be slower initially
- **Bundle size**: Additional dependencies increase extension size

### Low Risk
- **Error boundaries**: Additive changes, low impact on existing code
- **Caching**: Can be disabled if issues arise

## Validation Checklist

Before each phase completion:
- [ ] All existing tests pass
- [ ] New functionality has test coverage
- [ ] Performance benchmarks meet targets
- [ ] No TypeScript errors
- [ ] ESLint warnings addressed
- [ ] Documentation updated
- [ ] Changes reviewed by team

---

*This plan should be executed iteratively with continuous testing and validation at each step. Each phase can be implemented independently to minimize risk and allow for course correction.*
