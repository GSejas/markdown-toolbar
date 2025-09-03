# 🧪 CodeLens Providers Testing Documentation

## Overview
CodeLens providers are the most critical components requiring testing coverage, as they directly impact user experience by showing interactive formatting options above markdown content blocks.

## Component Inventory
- `BlockCodeLensProvider.ts` - Provides formatting options for code blocks
- `HeadingCodeLensProvider.ts` - Manages heading-specific formatting commands  
- `ListCodeLensProvider.ts` - Handles list formatting and toggling
- `TableCodeLensProvider.ts` - Table manipulation and formatting
- `ImageCodeLensProvider.ts` - Image insertion and management
- `LinkCodeLensProvider.ts` - Link creation and editing

## Testing Strategy

### Core Test Patterns
```typescript
describe('CodeLensProvider', () => {
  // 1. Provider Registration
  it('should register provider correctly')
  
  // 2. CodeLens Generation  
  it('should provide CodeLenses for target content')
  
  // 3. Command Resolution
  it('should resolve CodeLens commands')
  
  // 4. Context Awareness
  it('should adapt to document context')
  
  // 5. Performance
  it('should handle large documents efficiently')
});
```

### Mock Requirements
- `vscode.languages.registerCodeLensProvider`
- `vscode.TextDocument` with markdown content
- `vscode.commands.executeCommand`
- Document change events and context

### Success Criteria
- **Coverage Target**: 85%+ per provider
- **Test Count**: 15-20 tests per provider
- **Performance**: <100ms for large documents
- **Reliability**: No flaky test failures

---

# 🎨 UI Components Testing Documentation

## Overview
UI components manage the extension's visual presence and user interactions through VS Code's status bar and configuration interfaces.

## Component Inventory
- `StatusBarManager.ts` - Manages overall status bar presence
- `StatusBarToolbar.ts` - Individual toolbar button management
- `ConfigurationGenerator.ts` - Dynamic configuration UI generation

## Testing Strategy

### Core Test Patterns
```typescript
describe('UIComponent', () => {
  // 1. Component Initialization
  it('should initialize correctly')
  
  // 2. Status Bar Management
  it('should create/update status bar items')
  
  // 3. User Interactions
  it('should handle clicks and commands')
  
  // 4. Context Updates
  it('should respond to context changes')
  
  // 5. Configuration
  it('should handle configuration updates')
});
```

### Mock Requirements  
- `vscode.window.createStatusBarItem`
- `vscode.workspace.getConfiguration`
- Event emitters for context/config changes
- Command execution mocks

### Success Criteria
- **Coverage Target**: 80%+ per component
- **Test Count**: 12-15 tests per component  
- **Interaction**: All user flows tested
- **Responsiveness**: UI updates verified

---

# ⚙️ Services Testing Documentation

## Overview
Service components provide core infrastructure and state management for the extension's operation.

## Component Inventory
- `Logger.ts` - Centralized logging service
- `ContextKeyManager.ts` - VS Code context key management
- `ContextService.ts` - Application context coordination

## Testing Strategy

### Core Test Patterns
```typescript
describe('Service', () => {
  // 1. Service Initialization
  it('should initialize with dependencies')
  
  // 2. State Management
  it('should manage state correctly')
  
  // 3. Event Handling
  it('should handle events properly')
  
  // 4. Resource Cleanup
  it('should dispose resources correctly')
  
  // 5. Error Handling
  it('should handle errors gracefully')
});
```

### Mock Requirements
- Dependency injection mocks
- VS Code context API mocks  
- Event system mocks
- Configuration mocks

### Success Criteria
- **Coverage Target**: 85%+ per service
- **Test Count**: 10-12 tests per service
- **Reliability**: Stable state management
- **Performance**: Efficient resource usage

---

# 🔗 Integration Testing Documentation

## Overview
Integration testing validates component interactions and VS Code API integration to ensure the extension works as a cohesive system.

## Testing Areas
- Extension lifecycle (activation/deactivation)
- Command registration and execution
- Event handling across components
- Cross-component data flow

## Testing Strategy

### Core Test Patterns
```typescript
describe('Integration', () => {
  // 1. Extension Lifecycle
  it('should activate/deactivate correctly')
  
  // 2. Component Integration
  it('should coordinate between components')
  
  // 3. Command System
  it('should register and execute commands')
  
  // 4. Event Flow
  it('should handle event propagation')
  
  // 5. API Integration
  it('should interact with VS Code APIs')
});
```

### Test Infrastructure
- `@vscode/test-electron` for VS Code API testing
- Real extension host environment
- Controlled test workspaces
- Mock user interactions

### Success Criteria
- **Coverage Target**: 80%+ integration coverage
- **Test Count**: 20-25 integration tests
- **Stability**: Reliable API interactions
- **Performance**: Efficient component coordination

---

# 🎯 E2E Testing Documentation

## Overview
End-to-end testing validates complete user workflows and real-world usage scenarios to ensure the extension delivers expected user experience.

## Testing Scenarios
- Complete markdown editing workflows
- Status bar interaction flows
- CodeLens user journeys
- Configuration and preset switching

## Testing Strategy

### Core Test Patterns
```typescript
describe('E2E Workflow', () => {
  // 1. User Workflows
  it('should complete editing workflows')
  
  // 2. UI Interactions
  it('should handle UI interactions')
  
  // 3. Document Manipulation
  it('should manipulate documents correctly')
  
  // 4. Feature Integration
  it('should integrate all features')
  
  // 5. Error Recovery
  it('should recover from errors')
});
```

### Test Infrastructure
- Playwright for browser-based testing
- VS Code Extension Development Host
- Real markdown documents
- Simulated user interactions

### Success Criteria
- **Coverage Target**: 60%+ workflow coverage
- **Test Count**: 10-15 E2E tests
- **User Experience**: Complete user journeys tested
- **Reliability**: Stable workflow execution
