# 📚 API Reference

## Overview

This document provides comprehensive API reference for the Markdown Extended Toolbar VS Code extension, including public interfaces, types, and usage examples.

## 🏗️ Architecture

### Core Components

```typescript
// Main extension entry point
export class Extension {
  constructor(context: vscode.ExtensionContext)
  activate(): Promise<void>
  deactivate(): void
}

// Command factory for creating toolbar commands
export class CommandFactory {
  static createBoldCommand(context: ICommandContext): vscode.Disposable
  static createItalicCommand(context: ICommandContext): vscode.Disposable
  static createCodeCommand(context: ICommandContext): vscode.Disposable
}

// Context detector for markdown parsing
export class ContextDetector {
  detect(text: string, position: vscode.Position): CursorContext
  isInBold(text: string, position: vscode.Position): boolean
  isInItalic(text: string, position: vscode.Position): boolean
}

// Markdown formatter with atomic operations
export class MarkdownFormatter {
  formatBold(text: string, context: CursorContext): string
  formatItalic(text: string, context: CursorContext): string
  formatCode(text: string, context: CursorContext): string
}
```

## 📋 Public Interfaces

### ICommandContext

Shared context passed to all formatting commands.

```typescript
export interface ICommandContext {
  readonly formatter: MarkdownFormatter;
  readonly detector: ContextDetector;
  readonly logger: Logger;
  readonly settings: SettingsAdapter;
}
```

### CursorContext

Represents the current cursor position and surrounding context.

```typescript
export interface CursorContext {
  readonly position: vscode.Position;
  readonly lineText: string;
  readonly selectedText: string;
  readonly document: vscode.TextDocument;
  readonly isInBold: boolean;
  readonly isInItalic: boolean;
  readonly isInCode: boolean;
  readonly isInLink: boolean;
  readonly isInList: boolean;
}
```

### FormattingResult

Result of a formatting operation.

```typescript
export interface FormattingResult {
  readonly text: string;
  readonly newPosition?: vscode.Position;
  readonly success: boolean;
  readonly error?: string;
}
```

## 🎯 Command APIs

### Bold Formatting

```typescript
// Command: markdownToolbar.bold
export function formatBold(
  text: string,
  context: CursorContext
): FormattingResult

// Usage examples:
formatBold("Hello world", context)
// Returns: { text: "**Hello world**", success: true }

formatBold("**Hello** world", context)
// Returns: { text: "Hello world", success: true } // Toggles off
```

### Italic Formatting

```typescript
// Command: markdownToolbar.italic
export function formatItalic(
  text: string,
  context: CursorContext
): FormattingResult

// Usage examples:
formatItalic("Hello world", context)
// Returns: { text: "*Hello world*", success: true }

formatItalic("*Hello* world", context)
// Returns: { text: "Hello world", success: true } // Toggles off
```

### Code Formatting

```typescript
// Command: markdownToolbar.code
export function formatCode(
  text: string,
  context: CursorContext
): FormattingResult

// Usage examples:
formatCode("Hello world", context)
// Returns: { text: "`Hello world`", success: true }

formatCode("`Hello` world", context)
// Returns: { text: "Hello world", success: true } // Toggles off
```

### Link Formatting

```typescript
// Command: markdownToolbar.link
export function formatLink(
  text: string,
  context: CursorContext
): FormattingResult

// Usage examples:
formatLink("Hello world", context)
// Returns: { text: "[Hello world](url)", success: true }

formatLink("[Hello](url) world", context)
// Returns: { text: "Hello world", success: true } // Removes link
```

### List Formatting

```typescript
// Command: markdownToolbar.list
export function formatList(
  text: string,
  context: CursorContext
): FormattingResult

// Usage examples:
formatList("Hello world", context)
// Returns: { text: "- Hello world", success: true }

formatList("- Hello world", context)
// Returns: { text: "Hello world", success: true } // Removes list
```

## 🔧 Configuration APIs

### Settings Interface

```typescript
export interface ExtensionSettings {
  readonly enabled: boolean;
  readonly position: 'left' | 'right';
  readonly buttons: string[];
  readonly compact: boolean;
  readonly autoDetectDependencies: boolean;
}

// Access settings
const settings = new SettingsAdapter(vscode);
const config = settings.getConfiguration();
```

### Preset Configurations

```typescript
export type ToolbarPreset = 'core' | 'writer' | 'pro' | 'custom';

export const PRESET_CONFIGURATIONS: Record<ToolbarPreset, string[]> = {
  core: ['bold', 'italic', 'code', 'link', 'list'],
  writer: ['bold', 'italic', 'strike', 'link', 'heading', 'list', 'quote'],
  pro: ['bold', 'italic', 'strike', 'code', 'link', 'image', 'table', 'heading'],
  custom: [] // User-defined
};
```

## 📊 Status Bar APIs

### StatusBarManager

```typescript
export class StatusBarManager {
  constructor(context: vscode.ExtensionContext)

  // Create status bar items
  createStatusBar(): void

  // Update button states
  updateButtonStates(context: CursorContext): void

  // Toggle preset
  togglePreset(): void

  // Dispose all items
  dispose(): void
}
```

### Button States

```typescript
export interface ButtonState {
  readonly id: string;
  readonly text: string;
  readonly tooltip: string;
  readonly command: string;
  readonly active: boolean;
  readonly visible: boolean;
}
```

## 🔍 Context Detection APIs

### ContextDetector Methods

```typescript
export class ContextDetector {
  // Detect complete context
  detect(text: string, position: vscode.Position): CursorContext

  // Specific context checks
  isInBold(text: string, position: vscode.Position): boolean
  isInItalic(text: string, position: vscode.Position): boolean
  isInCode(text: string, position: vscode.Position): boolean
  isInLink(text: string, position: vscode.Position): boolean
  isInList(text: string, position: vscode.Position): boolean
  isInHeading(text: string, position: vscode.Position): boolean

  // Advanced detection
  getWordBoundaries(text: string, position: vscode.Position): vscode.Range
  getLineBoundaries(text: string, position: vscode.Position): vscode.Range
  getBlockBoundaries(text: string, position: vscode.Position): vscode.Range
}
```

## 📝 Logger APIs

### Logger Interface

```typescript
export interface Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

// Usage
const logger = new Logger('CommandFactory');
logger.info('Command executed successfully', { command: 'bold' });
logger.error('Failed to format text', { error: new Error('Invalid input') });
```

## 🧪 Testing APIs

### Test Utilities

```typescript
// Mock VS Code API
export const mockVscode = {
  workspace: { getConfiguration: jest.fn() },
  window: { showInformationMessage: jest.fn() },
  commands: { registerCommand: jest.fn() }
};

// Test helpers
export class TestHelper {
  static createMockDocument(content: string): vscode.TextDocument
  static createMockPosition(line: number, character: number): vscode.Position
  static createMockContext(): CursorContext
}
```

## 📖 Usage Examples

### Basic Formatting

```typescript
import { MarkdownFormatter, ContextDetector } from './engine';

const formatter = new MarkdownFormatter();
const detector = new ContextDetector();

// Format selected text
const result = formatter.formatBold("Hello world", {
  position: new vscode.Position(0, 5),
  lineText: "Hello world",
  selectedText: "Hello",
  // ... other context properties
});

console.log(result.text); // "**Hello** world"
```

### Custom Command Creation

```typescript
import { CommandFactory } from './commands';

export function createCustomCommand(context: ICommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('markdownToolbar.custom', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const position = editor.selection.active;
    const text = document.getText();

    const cursorContext = context.detector.detect(text, position);
    const result = context.formatter.formatBold(text, cursorContext);

    // Apply formatting atomically
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );

    await editor.edit(editBuilder => {
      editBuilder.replace(fullRange, result.text);
    });
  });
}
```

### Settings Integration

```typescript
import { SettingsAdapter } from './settings';

export class MyFeature {
  private settings: SettingsAdapter;

  constructor(vscodeImpl?: any) {
    this.settings = new SettingsAdapter(vscodeImpl);
  }

  async initialize() {
    const config = this.settings.getConfiguration();

    if (config.enabled) {
      // Feature is enabled
      this.setupFeature(config);
    }
  }

  private setupFeature(config: ExtensionSettings) {
    // Configure based on settings
    console.log(`Position: ${config.position}`);
    console.log(`Buttons: ${config.buttons.join(', ')}`);
  }
}
```

## 🚨 Error Handling

### Error Types

```typescript
export class FormattingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'FormattingError';
  }
}

export class ContextDetectionError extends Error {
  constructor(
    message: string,
    public readonly position: vscode.Position
  ) {
    super(message);
    this.name = 'ContextDetectionError';
  }
}
```

### Error Handling Patterns

```typescript
try {
  const result = formatter.formatBold(text, context);
  if (!result.success) {
    logger.warn('Formatting failed', { error: result.error });
    // Handle formatting failure
  }
} catch (error) {
  if (error instanceof FormattingError) {
    logger.error('Formatting error', {
      code: error.code,
      context: error.context
    });
  } else {
    logger.error('Unexpected error', { error });
  }
  // Handle unexpected errors
}
```

## 🔗 Extension Points

### Custom Formatters

```typescript
export interface CustomFormatter {
  readonly id: string;
  readonly name: string;

  format(text: string, context: CursorContext): FormattingResult;
  canFormat(text: string, context: CursorContext): boolean;
}

// Register custom formatter
export function registerCustomFormatter(formatter: CustomFormatter): void {
  // Add to formatter registry
}
```

### Event Listeners

```typescript
export interface ExtensionEvents {
  onFormattingApplied: (result: FormattingResult) => void;
  onContextChanged: (context: CursorContext) => void;
  onSettingsChanged: (settings: ExtensionSettings) => void;
}

// Subscribe to events
const events = getExtensionEvents();
events.onFormattingApplied(result => {
  logger.info('Formatting applied', { result });
});
```

## 📋 API Stability

### Version Compatibility

- **Major version**: Breaking changes (2.0.0)
- **Minor version**: New features (1.1.0)
- **Patch version**: Bug fixes (1.0.1)

### Deprecation Policy

1. **Mark as deprecated** in minor release
2. **Remove in next major release**
3. **Provide migration guide**

### Migration Examples

```typescript
// Deprecated in v1.1.0
export class OldFormatter {
  format(text: string): string {
    // @deprecated Use MarkdownFormatter instead
    return new MarkdownFormatter().formatBold(text, context);
  }
}

// New in v2.0.0
export class MarkdownFormatter {
  format(text: string, context: CursorContext): FormattingResult {
    // Implementation
  }
}
```
