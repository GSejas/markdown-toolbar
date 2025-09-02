# Copilot Instructions: Markdown Toolbar Extension

## JSDoc Header Format

All TypeScript files in this project use standardized JSDoc headers with the following format:

```typescript
/**
 * @moduleName: [Module Name] - [Brief Purpose]
 * @version: [Semantic Version]
 * @since: [YYYY-MM-DD]
 * @lastUpdated: [YYYY-MM-DD]
 * @projectSummary: [One-line project description]
 * @techStack: [Primary technologies used]
 * @dependency: [External dependencies]
 * @interModuleDependency: [Internal module dependencies]
 * @requirementsTraceability: [Links to requirements]
 * @briefDescription: [Detailed description of module purpose and functionality]
 * @methods: [Key methods/classes exported]
 * @contributors: [Primary contributors]
 * @examples: [Usage examples]
 * @vulnerabilitiesAssessment: [Security considerations]
 */
```

**Header Guidelines:**
- Use consistent versioning across related modules
- Update `@lastUpdated` when making changes
- Include all relevant `@dependency` and `@interModuleDependency` entries
- Link to requirements using `{@link Requirements.REQ_XXX}` format
- Keep `@briefDescription` concise but comprehensive
- Include practical `@examples` showing real usage
- Address security in `@vulnerabilitiesAssessment`

## Architecture Overview

This VS Code extension provides a context-aware markdown formatting toolbar using a clean separation of concerns:

- **Pure Logic Layer**: `src/engine/` contains `MarkdownFormatter` and `ContextDetector` - no VS Code APIs, easily unit testable
- **Command Layer**: `src/commands/` uses factory pattern with shared `ICommandContext` for dependency injection
- **UI Layer**: `src/ui/StatusBarManager` manages status bar items with real-time context awareness
- **Settings Layer**: `src/settings/SettingsAdapter` uses constructor injection for easy testing (`new SettingsAdapter(mockVscode)`)

## Key Patterns

### Dependency Injection for Testing
```typescript
// SettingsAdapter accepts injected vscode implementation
constructor(vscodeImpl?: any) {
  this.vscode = vscodeImpl || require('vscode');
}
```

### Command Factory Pattern
Commands are created via factory functions that receive shared context:
```typescript
// src/commands/index.ts - Shared context with formatter/detector
export function createBoldCommand(context: ICommandContext): vscode.Disposable
```

### Atomic Document Edits
All formatting operations replace the entire document in a single atomic edit to ensure undo-friendliness:
```typescript
const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
editBuilder.replace(fullRange, result.text);
```

### Context-Aware Status Bar
Status bar buttons change appearance based on cursor position using `ThemeColor('statusBarItem.prominentBackground')` for active states.

## Development Workflows

### Testing
- **Unit tests**: `npm run test:unit` (Vitest) - covers pure logic in `engine/` and `settings/`
- **Integration tests**: `npm run test:integration` - scaffolded for VS Code API testing
- **Coverage**: `npm run test:cov` - targets 75% statements, 65% branches

### Building
- **Development**: `npm run watch` - concurrent TypeScript + esbuild watching
- **Production**: `npm run package` - type check + lint + bundled output to `dist/`

### Key Commands
- `F5` - Launch extension host for debugging
- `npm run compile` - Full build with type checking and linting
- `npm run check-types` - TypeScript compilation without emit

## Configuration Structure

Settings use prefix `markdownToolbar.*`:
- `enabled`: boolean - show/hide toolbar
- `position`: 'left'|'right' - status bar alignment  
- `buttons`: string[] - active button IDs ('bold', 'italic', 'code', 'link', 'list')

## File Organization

- `src/extension.ts` - Entry point with `ExtensionState` class managing lifecycle
- `src/engine/` - Pure formatting logic (no VS Code dependencies)
- `src/commands/formatting/` - Individual command implementations
- `src/ui/StatusBarManager.ts` - Event-driven UI updates and theme integration
- `test/unit/` - Vitest tests with dependency injection
- `test/fixtures/` - Reusable test data and mock utilities

## Smart Formatting Behaviors

- **Bold/Italic Toggle**: Detects existing formatting and removes it, handles partial selections by expanding to unions
- **List Formatting**: Expands selection to full lines, normalizes mixed list types to bullets
- **Link Extraction**: When removing links, extracts URL and shows it to user
- **Context Detection**: Uses regex patterns to identify cursor position within markdown constructs

## Extension Activation

Activates `onLanguage:markdown` and creates two main components:
1. `CommandRegistry` - registers all formatting commands with shared context
2. `StatusBarManager` - creates status bar items and listens for editor/config changes

Proper disposal pattern ensures clean deactivation via `context.subscriptions.push()`.
