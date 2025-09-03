# Markdown Extended Toolbar Extension - Architecture Documentation

## 🏗️ System Architecture Overview

### Design Philosophy

The Markdown Extended Toolbar Extension follows a **clean architecture** pattern with clear separation of concerns, dependency injection for testability, and a modular approach that allows easy extension and maintenance.

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                    │
├─────────────────────────────────────────────────────────────┤
│                      UI Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  StatusBar      │  │  CodeLens       │  │  Hover       │ │
│  │  Manager        │  │  Providers      │  │  Providers   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Command Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Command        │  │  Header         │  │  Table       │ │
│  │  Registry       │  │  Commands       │  │  Commands    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Engine Layer (Pure Logic)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Context        │  │  Markdown       │  │  Settings    │ │
│  │  Detector       │  │  Formatter      │  │  Adapter     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Services Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Logger         │  │  Extension      │  │  External    │ │
│  │  Service        │  │  Registry       │  │  Integration │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles

1. **Dependency Injection**: All components accept dependencies via constructor injection
2. **Pure Logic Separation**: Engine layer has no VS Code dependencies
3. **External Extension Priority**: Leverage existing extensions over reimplementation
4. **Atomic Operations**: All text edits are atomic for proper undo/redo
5. **Event-Driven UI**: Status bar responds to editor state changes
6. **Contextual Awareness**: Actions adapt based on cursor position and document state

## 📦 Module Architecture

### Engine Layer (Pure Business Logic)

#### ContextDetector
**Purpose**: Sophisticated regex-based markdown context analysis
**Dependencies**: None (pure functions)
**Key Features**:
- Detects bold, italic, code, link, and list formatting at cursor position
- Handles complex overlap scenarios (partial selections, nested formatting)
- Document-level analysis (headers, tables, task lists, code blocks)
- Line-by-line context evaluation

```typescript
interface IMarkdownContext {
    isBold: boolean;
    isItalic: boolean;
    isCode: boolean;
    isLink: boolean;
    isList: boolean;
    boldRange?: { start: number; end: number };
    italicRange?: { start: number; end: number };
    // ... additional context properties
}
```

#### MarkdownFormatter
**Purpose**: Pure text transformation engine
**Dependencies**: ContextDetector
**Key Features**:
- Smart toggle behavior (remove existing formatting when appropriate)
- Union selection handling for overlapping formats
- Link extraction with URL preservation
- List normalization and type conversion
- Atomic text replacements ensuring undo-friendliness

```typescript
interface IFormattingResult {
    text: string;
    selectionStart: number;
    selectionEnd: number;
    extractedUrl?: string;
}
```

### Command Layer
#### Command Layer (actual implementation)
Note: the codebase uses a CommandFactory / command modules approach rather than a single "CommandRegistry" singleton imported at module load time. Commands are implemented as small modules (for example `HeaderCommands`, `TableCommands`, `MermaidCommands`) and registered during extension activation. The code favors an external-extension-first delegation strategy with lightweight internal fallbacks.

Key pieces:

- `CommandFactory` — a small factory/registry used by the extension to wire command handlers. Tests and activation code should call into the factory to register handlers during activation. Avoid import-time side-effects: do not register handlers at module import time if you want deterministic tests (see Testability note below).
- Command modules (examples in `src/commands/`): each module exports functions that register and implement related commands. Examples in the repo:
    - `HeaderCommands.ts` — header level adjustments (increase/decrease), TOC integration, header navigation
    - `TableCommands.ts` — add/remove columns/rows, format, sort, and fallbacks to internal table tools
    - `MermaidCommands.ts` — preview, edit, export, and validate mermaid blocks

Contract (informal):

- Inputs: VS Code editor/document, selection/position, optional external extension args
- Outputs: atomic text edits or UI actions (preview webviews, exports)
- Error modes: external extension not available, parse/validation failures

Command registration is intentionally performed at activation so tests can control registration and reset state between runs.

#### Individual Command Modules
- **Header Commands**: H+/H- level adjustment, TOC integration
- **Table Commands**: Add/remove columns/rows, formatting, sorting
- **Mermaid Commands**: Preview, edit, export, validation
- **Formatting Commands**: Bold, italic, code, strikethrough
- **Structure Commands**: Lists, links, checkboxes

### UI Layer

#### StatusBarManager
**Purpose**: Context-aware toolbar management
**Dependencies**: CommandRegistry, SettingsAdapter
**Features**:
- Real-time button state updates based on cursor position
- Theme-aware styling with `ThemeColor` integration
- Configuration-driven button visibility
- Event-driven updates on editor changes

#### Provider Architecture

##### CodeLens Providers
- `MermaidCodeLensProvider` (actual): the repository currently exposes `MermaidCodeLensProvider` in `src/providers/mermaidCodeLensProvider.ts`. This provider surfaces CodeLenses for:
    - Mermaid fenced code blocks (Preview / Edit / Export / Fix Syntax)
    - Markdown headers (H+ / H- / Add to TOC actions)
    - Markdown tables (Add Column / Add Row / Format / Sort)

Note: header and table CodeLens functionality is implemented inside `MermaidCodeLensProvider` (merged provider) rather than as separate files named `HeaderCodeLensProvider` or `TableCodeLensProvider`. This keeps related document-scanning logic together and reduces duplication. If you prefer separate providers for separation of concerns, a future refactor could extract the header/table logic into dedicated providers.

##### Hover Providers
- `EnhancedHoverProvider` (implemented in `src/providers/mermaidHoverProvider.ts`): provides contextual hover content for headers, tables, mermaid blocks, and checkboxes. It builds trusted Markdown hover content containing command URIs which call into the command modules described above.

Provider responsibilities summary:
- Detect element ranges (headers, tables, mermaid code fences, checkboxes) using `ContextDetector` where appropriate
- Build CodeLens/hover UI elements that invoke commands via `CommandFactory`/registered handlers
- Prefer external extension commands (for example `markdownTableEditor`, `mermaid.*`) and fall back to internal handlers implemented in `src/commands/*`

### Services Layer

#### SettingsAdapter
**Purpose**: Configuration management with dependency injection
**Features**:
- Constructor injection for easy testing
- VS Code settings integration
- Configuration change listeners
- Default value management

```typescript
constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
}
```

#### Logger Service
**Purpose**: Structured logging with context
**Features**:
- Log level configuration
- Module-specific logging contexts
- Performance monitoring
- Debug information for troubleshooting

#### ExternalIntegration Service
**Purpose**: External extension integration management
**Features**:
- Extension availability detection
- Graceful fallback to internal implementations
- Version compatibility checking
- Dynamic feature enabling/disabling

## 🔌 Extension Integration Strategy

### Primary External Extensions

1. **Mermaid Support**
   - Primary: `vscode.mermaid-markdown-syntax-highlighting`
   - Fallback: Internal preview with basic validation
   - Integration: Command delegation, syntax validation

2. **Table Editing**
   - Primary: `markdown-table-editor`
   - Fallback: Internal table formatting
   - Integration: Table detection, formatting delegation

3. **TOC Management**
   - Primary: `markdown-preview-enhanced`
   - Fallback: Internal TOC generation
   - Integration: Header detection, TOC insertion

4. **Task Management**
   - Primary: `task-board` or similar
   - Fallback: Internal checkbox toggle
   - Integration: Task list detection, management delegation

### Fallback Strategy

```typescript
class ExternalIntegration {
    async executeWithFallback(primaryCommand: string, fallbackAction: () => Promise<any>) {
        try {
            if (await this.isExtensionAvailable(primaryCommand)) {
                return await vscode.commands.executeCommand(primaryCommand);
            }
        } catch (error) {
            logger.warn(`Primary command failed: ${primaryCommand}`, error);
        }
        return await fallbackAction();
    }
}
```

## 🎯 Context Detection Algorithm

### Multi-Pass Analysis

1. **Character-Level Detection**: Regex pattern matching for inline formatting
2. **Line-Level Analysis**: List, header, table detection
3. **Block-Level Scanning**: Code blocks, mermaid diagrams
4. **Document-Level Statistics**: Word count, feature usage, structure analysis

### Sophisticated Range Handling

```typescript
// Example: Bold formatting with partial overlap
detectBoldContext(text: string, start: number, end: number, context: IMarkdownContext): void {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;

        if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
            // Complex logic for union, intersection, and partial overlap scenarios
            context.isBold = true;
            context.boldRange = { start: matchStart, end: matchEnd };
            break;
        }
    }
}
```

## 🧪 Testing Architecture

### Layer-Specific Testing

1. **Engine Layer**: Pure unit tests with Vitest
   - No VS Code dependencies
   - Fast execution, high coverage
   - Comprehensive edge case testing

2. **Command Layer**: Integration tests with VS Code Test Framework
   - Mocked VS Code API
   - Command execution validation
   - UI state verification

3. **Provider Layer**: Integration tests with document fixtures
   - CodeLens provider testing
   - Hover provider verification
   - Event handling validation

### Mock Strategy

```typescript
// SettingsAdapter testing with dependency injection
const mockVscode = {
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockImplementation(key => defaults[key])
        })
    }
};

const adapter = new SettingsAdapter(mockVscode);
```

## 📊 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Providers only activate on markdown files
2. **Incremental Updates**: Context detection on cursor position changes only
3. **Caching**: Document analysis results cached until modification
4. **Debouncing**: UI updates debounced to prevent excessive redraws
5. **Minimal DOM**: Status bar items created once, updated in place

### Memory Management

- Dispose patterns for all subscriptions
- WeakMap usage for document-specific caches
- Event listener cleanup on deactivation
- Resource cleanup in provider disposal

## 🔧 Configuration Architecture

### Settings Schema

```typescript
interface MarkdownToolbarSettings {
    enabled: boolean;
    position: 'left' | 'right';
    buttons: ButtonId[];
    theme: {
        activeColor: string;
        inactiveColor: string;
    };
    integration: {
        preferExternal: boolean;
        fallbackTimeout: number;
    };
}
```

### Dynamic Configuration

- Real-time settings updates without restart
- Context-sensitive button availability
- Per-workspace configuration support
- User vs workspace settings precedence

## 🚀 Extension Lifecycle

### Activation Sequence

1. **Context Registration**: Register providers and commands
2. **Settings Initialization**: Load configuration and setup listeners
3. **UI Creation**: Initialize status bar items
4. **Event Binding**: Setup editor change listeners
5. **External Integration Check**: Detect available extensions

### Deactivation Sequence

1. **Event Cleanup**: Remove all event listeners
2. **UI Disposal**: Clean up status bar items
3. **Command Unregistration**: Remove command handlers
4. **Provider Disposal**: Clean up CodeLens and Hover providers
5. **Resource Cleanup**: Release all held resources

## 🔄 Data Flow

### User Interaction Flow

```
User Action (Click/Hover) 
    → Context Detection 
    → Engine Processing 
    → Document Modification 
    → UI State Update
    → External Integration (if applicable)
```

### Configuration Change Flow

```
Settings Change 
    → Configuration Validation 
    → UI Reconstruction 
    → Command Re-registration 
    → Provider Updates
    → State Persistence
```

## 📈 Scalability Design

### Extension Points

1. **Command Factory**: Easy addition of new formatting commands
2. **Provider Registry**: Simple registration of new providers
3. **Context Detectors**: Pluggable context detection modules
4. **External Integrations**: Configurable external extension support

### Future Enhancements

- Plugin system for custom commands
- Theme engine for customizable UI
- Advanced table editor integration
- Multi-language markdown support
- Real-time collaboration features

This architecture provides a solid foundation for the Markdown Extended Toolbar Extension while maintaining flexibility for future enhancements and ensuring excellent performance and user experience.
