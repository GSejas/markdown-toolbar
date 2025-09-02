# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Common Development Commands

### Building and Development

- `npm run compile` - Full build with type checking and linting
- `npm run watch` - Concurrent TypeScript + esbuild watching for development
- `npm run package` - Production build with type checking, linting, and bundled output to `dist/`
- `npm run check-types` - TypeScript compilation without emit

### Testing

- `npm run test` - Run both unit and integration tests
- `npm run test:unit` - Run Vitest unit tests only
- `npm run test:unit:watch` - Run unit tests in watch mode
- `npm run test:integration` - Run VS Code integration tests
- `npm run test:cov` - Run tests with coverage report

### Linting and Quality

- `npm run lint` - Run ESLint on source files
- `npm run pretest` - Compile tests, compile source, and lint (runs before testing)

## Architecture Overview

This VS Code extension provides a context-aware markdown formatting toolbar with clean separation of concerns:

### Core Architecture

- **Pure Logic Layer** (`src/engine/`): Contains `MarkdownFormatter` and `ContextDetector` with no VS Code APIs for easy unit testing
- **Command Layer** (`src/commands/`): Uses factory pattern with shared `ICommandContext` for dependency injection
- **UI Layer** (`src/ui/StatusBarManager`): Manages status bar items with real-time context awareness
- **Settings Layer** (`src/settings/SettingsAdapter`): Uses constructor injection for testing

### Key Design Patterns

#### Dependency Injection for Testing

```typescript
// SettingsAdapter accepts injected vscode implementation
constructor(vscodeImpl?: any) {
  this.vscode = vscodeImpl || require('vscode');
}
```

#### Command Factory Pattern

Commands are created via factory functions that receive shared context through `ICommandContext`.

#### Atomic Document Edits

All formatting operations replace the entire document in a single atomic edit to ensure undo-friendliness.

### File Structure

- `src/extension.ts` - Entry point with `ExtensionState` class managing lifecycle
- `src/engine/` - Pure formatting logic (no VS Code dependencies)
  - `MarkdownFormatter.ts` - Core formatting logic for bold, italic, code, links, lists
  - `ContextDetector.ts` - Detects markdown context at cursor position
- `src/commands/` - Command implementations using factory pattern
  - `index.ts` - `CommandRegistry` and shared `ICommandContext`
  - `formatting/` - Individual command implementations (bold, italic, code, link, list)
- `src/ui/StatusBarManager.ts` - Event-driven UI updates and theme integration
- `src/settings/SettingsAdapter.ts` - Configuration management with dependency injection

### Smart Formatting Behaviors

- **Bold/Italic Toggle**: Detects existing formatting and removes it, handles partial selections by expanding to unions
- **List Formatting**: Expands selection to full lines, normalizes mixed list types to bullets
- **Link Extraction**: When removing links, extracts URL and shows it to user
- **Context Detection**: Uses regex patterns to identify cursor position within markdown constructs

## Extension Configuration

Settings use the `markdownToolbar.*` prefix:

- `enabled`: boolean - show/hide toolbar
- `position`: 'left'|'right' - status bar alignment
- `buttons`: string[] - active button IDs ('bold', 'italic', 'code', 'link', 'list')

## Testing Strategy

- **Unit Tests**: Use Vitest to test pure logic in `engine/` and `settings/` with dependency injection
- **Integration Tests**: VS Code API testing (scaffolded)
- **Coverage Targets**: 75% statements, 65% branches
- **Test Files**: Located in `test/` directory with fixtures in `test/fixtures/`

## Extension Lifecycle

1. **Activation**: Triggers `onLanguage:markdown`
2. **Initialization**: Creates `CommandRegistry` and `StatusBarManager`
3. **Command Registration**: All formatting commands registered with shared context
4. **Status Bar Setup**: Creates status bar items and listens for editor/config changes
5. **Disposal**: Proper cleanup via `context.subscriptions.push()`

## Development Workflow

1. Use `F5` to launch extension host for debugging
2. Use `npm run watch` for continuous development builds
3. Run `npm run test:unit:watch` for test-driven development
4. Use `npm run compile` before committing to ensure code quality
