# GitHub Issue Template: Library Modernization & Architecture Enhancement

## 🎯 Objective

Modernize the markdown toolbar extension by integrating industry-standard libraries to improve performance, maintainability, and reliability. Replace custom implementations with proven, Microsoft-maintained solutions.

## 📊 Current State Analysis

### Issues Identified
- ❌ **Command Recursion**: Fixed infinite loop in `CommandFactory` (mdToolbar.heading.h1)
- ❌ **Custom Regex Parsing**: Brittle header detection, missing edge cases
- ❌ **No Caching**: Repeated expensive document parsing
- ❌ **Manual Singletons**: Hard to test, tightly coupled services
- ❌ **Poor Error Boundaries**: Providers can crash extension
- ❌ **Test Infrastructure**: esbuild service conflicts during testing

### Performance Gaps
- Headers parsed on every CodeLens request
- No document structure caching
- Synchronous regex operations in providers

## 🎯 Success Criteria

### Performance Targets
- [ ] 50%+ reduction in document parsing time
- [ ] 90%+ cache hit rate for repeated document access
- [ ] <100ms response time for CodeLens generation

### Reliability Targets
- [ ] Zero unhandled exceptions in providers
- [ ] Graceful degradation when services fail
- [ ] 99.9% provider method success rate

### Code Quality Targets
- [ ] 80%+ test coverage
- [ ] All TypeScript strict mode compliance
- [ ] ESLint warnings < 10

## 📋 Implementation Phases

### Phase 1: Core Library Integration (Weeks 1-3)

#### 1.1 vscode-markdown-languageservice Integration
**Priority: Critical**

```bash
npm install vscode-markdown-languageservice
```

**Files to Create/Modify:**
- `src/engine/MarkdownLanguageServiceWrapper.ts` (new)
- `src/providers/headerCodeLensProvider.ts` (major refactor)
- `src/extension.ts` (service initialization)

**Key Changes:**
- Replace regex-based parsing with Microsoft's language service
- Use `getDocumentSymbols()` API for header extraction
- Implement proper error boundaries

**API Example:**
```typescript
const symbols = await languageService.getDocumentSymbols(
  document, 
  { includeLinkDefinitions: false }, 
  token
);
const headers = symbols
  .filter(symbol => symbol.kind === 13) // Headers
  .map(symbol => convertSymbolToHeaderInfo(symbol));
```

#### 1.2 Document Caching with quick-lru
**Priority: High**

```bash
npm install quick-lru @types/quick-lru
```

**Files to Create/Modify:**
- `src/engine/DocumentCache.ts` (new)
- `src/providers/headerCodeLensProvider.ts` (integrate caching)

**Key Features:**
- Version-based cache invalidation
- LRU eviction strategy (maxSize: 100)
- VS Code document change event integration

#### 1.3 Dependency Injection with tsyringe
**Priority: Medium**

```bash
npm install tsyringe reflect-metadata
```

**Files to Modify:**
- `src/extension.ts` (container setup)
- All service classes (add decorators)
- All providers (constructor injection)
- Test files (container-based mocking)

**Migration Pattern:**
```typescript
// Before
export class SomeService {
  private static instance: SomeService;
  static getInstance() { ... }
}

// After  
@singleton()
@injectable()
export class SomeService {
  constructor(private dependency: OtherService) {}
}
```

### Phase 2: Enhanced Markdown Support (Week 4)

#### 2.1 Advanced Parsing with remark
**Priority: Medium**

```bash
npm install remark remark-gfm remark-frontmatter @types/unist
```

**New Features:**
- GitHub Flavored Markdown support (tables, strikethrough)
- YAML frontmatter parsing
- AST-based analysis for complex structures

### Phase 3: Reliability & Testing (Week 5)

#### 3.1 Error Boundaries
**Priority: Critical**

**Implementation:**
```typescript
export function withErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  return operation().catch(error => {
    logger.error(`Error in ${context}:`, error);
    return fallback;
  });
}
```

#### 3.2 Testing Infrastructure
**Priority: High**

```bash
npm install --save-dev vitest @vitest/ui sinon ts-mockito
```

**Test Structure:**
- Unit tests for each new service
- Integration tests for providers
- Performance benchmarks
- Separate test/build configurations

## 🔄 Implementation Strategy

### Week-by-Week Breakdown

**Week 1: vscode-markdown-languageservice**
- Days 1-2: Service wrapper implementation
- Days 3-4: HeaderCodeLensProvider migration  
- Days 5-7: Testing and validation

**Week 2: Document Caching**
- Days 1-2: Cache implementation
- Days 3-4: Provider integration
- Days 5-7: Performance testing

**Week 3: Dependency Injection**
- Days 1-3: Service conversion
- Days 4-5: Provider updates
- Days 6-7: Test migration

**Week 4: Enhanced Markdown + Error Boundaries**
- Days 1-3: remark integration
- Days 4-7: Error boundary implementation

**Week 5: Testing & Documentation**
- Days 1-4: Comprehensive test suite
- Days 5-7: Documentation updates

### Risk Mitigation

**High Risk Items:**
- vscode-markdown-languageservice API complexity → Start with minimal wrapper
- DI conversion breaking changes → Use feature flags
- Performance regression → Benchmark at each step

**Rollback Strategy:**
- Feature flags for new parsing engine
- Ability to fallback to regex parsing
- Configuration options to disable features

## 🧪 Testing Strategy

### Test Categories
1. **Unit Tests**: Pure logic, service methods
2. **Integration Tests**: Provider behavior, command execution  
3. **Performance Tests**: Parsing speed, memory usage
4. **Regression Tests**: Existing functionality preservation

### Test Infrastructure Changes
- Separate test configuration from build watchers
- Comprehensive vscode module mocking
- Performance benchmarking suite
- Coverage reporting

### Validation Checklist
Before each phase:
- [ ] All existing tests pass
- [ ] New functionality has test coverage
- [ ] Performance benchmarks meet targets
- [ ] TypeScript compilation clean
- [ ] ESLint compliance

## 📈 Success Metrics & Monitoring

### Key Performance Indicators
- CodeLens generation time
- Cache hit/miss ratios  
- Extension activation time
- Memory usage patterns
- Error rates by provider

### Monitoring Implementation
- Performance timing hooks
- Diagnostic commands for troubleshooting
- Error rate tracking
- User-facing performance indicators

## 🔧 Dependencies & Requirements

### New Dependencies
```json
{
  "dependencies": {
    "vscode-markdown-languageservice": "^0.x.x",
    "quick-lru": "^6.x.x", 
    "tsyringe": "^4.x.x",
    "reflect-metadata": "^0.x.x",
    "remark": "^14.x.x",
    "remark-gfm": "^3.x.x",
    "remark-frontmatter": "^4.x.x"
  },
  "devDependencies": {
    "vitest": "^0.x.x",
    "@vitest/ui": "^0.x.x", 
    "sinon": "^15.x.x",
    "ts-mockito": "^2.x.x"
  }
}
```

### Bundle Size Impact
- Estimated increase: ~50-100KB
- Mitigation: Tree shaking, conditional loading
- Monitoring: Bundle analyzer in CI

## 📝 Documentation Updates

### Required Documentation
- [ ] Update ARCHITECTURE.md with new patterns
- [ ] Create migration guide for contributors  
- [ ] Update JSDoc headers for new modules
- [ ] Performance tuning guide
- [ ] Troubleshooting guide

### API Documentation
- [ ] New service interfaces
- [ ] Caching behavior
- [ ] Error handling patterns
- [ ] Testing utilities

## 🚀 Acceptance Criteria

### Phase 1 Complete When:
- [ ] vscode-markdown-languageservice successfully replaces regex parsing
- [ ] Document caching reduces repeat parsing by 90%+
- [ ] All services use dependency injection
- [ ] Zero regression in existing functionality
- [ ] Performance benchmarks show improvement

### Project Complete When:
- [ ] All success criteria met
- [ ] Comprehensive test coverage achieved
- [ ] Documentation updated
- [ ] Performance monitoring in place
- [ ] Ready for production deployment

---

## 💬 Discussion Points

1. **Library Selection**: Any concerns about the chosen libraries?
2. **Migration Timeline**: Is 5-week timeline realistic?
3. **Breaking Changes**: How to handle potential API changes?
4. **Testing Strategy**: Additional test scenarios needed?
5. **Performance Targets**: Are the benchmarks appropriate?

## 🏷️ Labels
`enhancement` `architecture` `performance` `dependencies` `breaking-change` `needs-review`

---

*This issue serves as the master tracking issue for the library modernization effort. Individual implementation tasks will be created as separate issues referencing this plan.*
