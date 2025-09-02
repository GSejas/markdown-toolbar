# V1 Implementation Plan: Preset-Aware Context-Driven Markdown Toolbar

## Implementation Strategy: TDD Feature-by-Feature

Following the planning docs principles, we'll implement using:
1. **TDD First**: Write test outlines, define interfaces, then implement
2. **Pure Logic Layer**: No VS Code APIs in core business logic
3. **Dependency Injection**: Constructor injection for all VS Code dependencies
4. **Complete Migration**: No old system compatibility - fresh start
5. **Feature-by-Feature**: Testable, isolated implementation

## Phase 1: Core Type System & Interfaces (Day 1)

### 1.1 Type Definitions (`src/types/`)
- `Buttons.ts` - ButtonId union types, PresetId types
- `Context.ts` - Context key interfaces, detection results
- `Dependencies.ts` - Extension detection interfaces

### 1.2 Constants (`src/constants/`)
- `contextKeys.ts` - Context key string constants
- `configKeys.ts` - Configuration key constants  
- `extensionIds.ts` - Partner extension IDs

### 1.3 Test Outlines (Write First!)
```typescript
// test/unit/types/ButtonTypes.test.ts
describe('Button Type System', () => {
  it('should validate all button IDs are properly typed')
  it('should map button IDs to command IDs correctly')
  it('should group buttons by category properly')
})
```

## Phase 2: Dependency Detection System (Day 1-2)

### 2.1 Core Service
```typescript
// src/deps/DependencyDetector.ts
export interface IDependencyState {
  hasMAIO: boolean;
  hasMarkdownlint: boolean;  
  hasPasteImage: boolean;
  hasMPE: boolean;
}

export class DependencyDetector {
  constructor(private vscode?: any) // Dependency injection
  
  detectAll(): IDependencyState
  onExtensionChange(callback: (state: IDependencyState) => void): Disposable
}
```

### 2.2 E2E Integration Test (Write First!)
```typescript
// test/integration/dependency-detection.test.ts
suite('Dependency Detection E2E', () => {
  test('should detect when MAIO is installed and enabled')
  test('should detect when MAIO is installed but disabled')  
  test('should detect when MAIO is not installed')
  test('should update context keys when extension state changes')
})
```

### 2.3 Unit Tests (Write First!)
```typescript
// test/unit/deps/DependencyDetector.test.ts
describe('DependencyDetector', () => {
  it('should detect installed extensions via API')
  it('should handle missing extensions gracefully') 
  it('should emit change events when extensions are added/removed')
  it('should cache detection results for performance')
})
```

## Phase 3: Preset System (Day 2-3)

### 3.1 Core Service 
```typescript
// src/presets/PresetManager.ts
export interface IPresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  buttons: ButtonId[];
  dependsOn?: string[]; // Extension requirements
}

export class PresetManager {
  constructor(private vscode?: any, private deps?: IDependencyDetector)
  
  getCurrentPreset(): IPresetDefinition
  switchPreset(presetId: PresetId): Promise<void>
  getEffectiveButtons(): ButtonId[] // Filters based on dependencies
  getCustomButtons(): ButtonId[]
  setCustomButtons(buttons: ButtonId[]): Promise<void>
}
```

### 3.2 Test-First Implementation
```typescript
// test/unit/presets/PresetManager.test.ts
describe('PresetManager', () => {
  it('should return Core preset by default')
  it('should filter buttons based on extension availability')
  it('should persist preset changes to settings')
  it('should emit events when preset changes')
  it('should handle custom preset with user-defined buttons')
})
```

## Phase 4: Context Services (Day 3-4)

### 4.1 Table Context Service
```typescript
// src/context/TableContextService.ts
export interface ITableContext {
  inTable: boolean;
  tableRange?: { start: number; end: number };
  currentColumn?: number;
  columnCount?: number;
}

export class TableContextService {
  constructor(private vscode?: any)
  
  detectTableContext(text: string, position: number): ITableContext
  isInTable(text: string, position: number): boolean
}
```

### 4.2 Task Context Service  
```typescript
// src/context/TaskLineService.ts  
export interface ITaskContext {
  onTaskLine: boolean;
  taskState?: 'incomplete' | 'complete';
  taskRange?: { start: number; end: number };
}

export class TaskLineService {
  detectTaskContext(text: string, position: number): ITaskContext
  isOnTaskLine(text: string, position: number): boolean
}
```

### 4.3 Context Tests (Write First!)
```typescript
// test/unit/context/TableContextService.test.ts
describe('TableContextService', () => {
  it('should detect cursor inside pipe table')
  it('should detect cursor outside table')
  it('should handle malformed tables gracefully')
  it('should identify column position in table')
})

// test/unit/context/TaskLineService.test.ts  
describe('TaskLineService', () => {
  it('should detect cursor on incomplete task line')
  it('should detect cursor on completed task line')
  it('should detect cursor on non-task list line')
  it('should handle various task list formats')
})
```

## Phase 5: Command Migration & Delegation (Day 4-5)

### 5.1 New Command Structure
- Migrate from `markdownToolbar.*` to `mdToolbar.*`
- Add delegation layer for external extensions
- Implement fallbacks for missing dependencies

### 5.2 Command Tests (Write First!)
```typescript
// test/integration/command-delegation.test.ts
suite('Command Delegation E2E', () => {
  test('should delegate to MAIO when available')
  test('should show CTA when MAIO missing')
  test('should use internal fallback when appropriate')
  test('should handle command execution failures gracefully')
})
```

## Phase 6: UI Integration (Day 5-6)

### 6.1 Package.json Updates
- New command contributions with proper `when` conditions
- Menu visibility based on context keys
- Configuration schema updates

### 6.2 QuickPick Flows
- Preset switcher
- Custom button selector
- Settings persistence

## Test Coverage Goals
- **Statements**: 80% (increased from 75%)
- **Branches**: 70% (increased from 65%) 
- **Lines**: 80% (increased from 75%)
- **Functions**: 75% (increased from 70%)

## Development Workflow
1. **Red**: Write failing test
2. **Green**: Implement minimal working code
3. **Refactor**: Clean up while keeping tests green
4. **Integration**: Test end-to-end functionality
5. **Document**: Update docs with new patterns

## Quality Gates
- All tests pass before merge
- Coverage thresholds met
- TypeScript strict mode compliance
- ESLint clean (no warnings)
- Integration tests pass in VS Code

## Success Criteria for V1
- [ ] Dependency detection works with real extensions
- [ ] Core/Writer/Pro presets function correctly
- [ ] Context detection updates in real-time  
- [ ] Command delegation and fallbacks work
- [ ] Settings persist correctly
- [ ] 80%+ test coverage achieved
- [ ] E2E tests validate key user journeys

## Next Steps
1. Create type definitions and interfaces (30 min)
2. Write dependency detection tests (45 min)
3. Implement DependencyDetector with TDD (1 hour)
4. Create preset system tests (45 min)
5. Implement PresetManager with TDD (1.5 hours)

This approach ensures we build a solid foundation with comprehensive testing before adding complexity.