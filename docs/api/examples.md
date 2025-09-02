# 💡 API Usage Examples

## Overview

This document provides practical examples of using the Markdown Toolbar extension APIs for common use cases and integration scenarios.

## 🎯 Basic Usage Examples

### Formatting Text Programmatically

```typescript
import * as vscode from 'vscode';
import { MarkdownFormatter, ContextDetector } from './engine';

export async function formatSelectedText() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor');
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  const text = document.getText();

  // Create formatter and detector
  const formatter = new MarkdownFormatter();
  const detector = new ContextDetector();

  // Detect context at cursor
  const context = detector.detect(text, selection.active);

  // Apply bold formatting
  const result = formatter.formatBold(text, context);

  if (result.success) {
    // Replace entire document with formatted text
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );

    await editor.edit(editBuilder => {
      editBuilder.replace(fullRange, result.text);
    });

    vscode.window.showInformationMessage('Text formatted successfully');
  } else {
    vscode.window.showErrorMessage(`Formatting failed: ${result.error}`);
  }
}
```

### Creating Custom Commands

```typescript
import * as vscode from 'vscode';
import { CommandFactory, ICommandContext } from './commands';

export function createUnderlineCommand(context: ICommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('markdownToolbar.underline', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    try {
      const document = editor.document;
      const text = document.getText();
      const position = editor.selection.active;

      // Detect current context
      const cursorContext = context.detector.detect(text, position);

      // Custom underline formatting (using HTML since Markdown doesn't have underline)
      const result = formatUnderline(text, cursorContext);

      // Apply formatting
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, result);
      });

      context.logger.info('Underline formatting applied');
    } catch (error) {
      context.logger.error('Underline formatting failed', { error });
      vscode.window.showErrorMessage('Failed to apply underline formatting');
    }
  });
}

function formatUnderline(text: string, context: CursorContext): string {
  const selectedText = context.selectedText || getWordAtPosition(text, context.position);

  if (context.selectedText) {
    // Replace selected text with underlined version
    return text.replace(context.selectedText, `<u>${context.selectedText}</u>`);
  } else {
    // Insert underline tags around word
    const beforeWord = text.substring(0, context.position.character);
    const afterWord = text.substring(context.position.character);
    return `${beforeWord}<u>${selectedText}</u>${afterWord}`;
  }
}
```

## 🔧 Advanced Integration Examples

### Custom Status Bar Integration

```typescript
import * as vscode from 'vscode';
import { StatusBarManager } from './ui/StatusBarManager';

export class CustomStatusBarManager extends StatusBarManager {
  private customButton: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.initializeCustomButton();
  }

  private initializeCustomButton() {
    this.customButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.customButton.command = 'markdownToolbar.customAction';
    this.updateCustomButton();
    this.customButton.show();
  }

  private updateCustomButton() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      this.customButton.text = '$(custom-icon) Custom';
      this.customButton.tooltip = 'Custom Markdown Action';
      this.customButton.backgroundColor = undefined;
    } else {
      this.customButton.text = '$(custom-icon) Custom';
      this.customButton.tooltip = 'Custom action (Markdown only)';
      this.customButton.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  updateButtonStates(context: CursorContext) {
    super.updateButtonStates(context);
    this.updateCustomButton();
  }

  dispose() {
    super.dispose();
    this.customButton.dispose();
  }
}
```

### Settings-Based Behavior

```typescript
import * as vscode from 'vscode';
import { SettingsAdapter } from './settings';

export class AdaptiveFormatter {
  private settings: SettingsAdapter;

  constructor() {
    this.settings = new SettingsAdapter();
  }

  async formatText(text: string, context: CursorContext): Promise<string> {
    const config = this.settings.getConfiguration();

    // Adapt formatting based on settings
    switch (config.preset) {
      case 'writer':
        return this.applyWriterFormatting(text, context);
      case 'pro':
        return this.applyProFormatting(text, context);
      case 'custom':
        return this.applyCustomFormatting(text, context, config);
      default:
        return this.applyCoreFormatting(text, context);
    }
  }

  private applyWriterFormatting(text: string, context: CursorContext): string {
    // Writer-focused formatting: emphasis on readability
    let result = text;

    if (context.isInBold) {
      result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    if (context.isInItalic) {
      result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    return result;
  }

  private applyProFormatting(text: string, context: CursorContext): string {
    // Professional formatting: strict markdown compliance
    const formatter = new MarkdownFormatter();
    let result = text;

    if (context.isInBold) {
      result = formatter.formatBold(result, context).text;
    }

    if (context.isInItalic) {
      result = formatter.formatItalic(result, context).text;
    }

    return result;
  }

  private applyCustomFormatting(text: string, context: CursorContext, config: any): string {
    // Custom formatting based on user preferences
    let result = text;

    // Apply only enabled formatting types
    if (config.custom?.enableBold && context.isInBold) {
      result = new MarkdownFormatter().formatBold(result, context).text;
    }

    if (config.custom?.enableItalic && context.isInItalic) {
      result = new MarkdownFormatter().formatItalic(result, context).text;
    }

    return result;
  }

  private applyCoreFormatting(text: string, context: CursorContext): string {
    // Basic formatting for core functionality
    const formatter = new MarkdownFormatter();
    return formatter.formatBold(text, context).text;
  }
}
```

## 📊 Analytics and Monitoring

### Usage Tracking

```typescript
import * as vscode from 'vscode';

export class UsageAnalytics {
  private usageData: Map<string, number> = new Map();
  private sessionStart: Date = new Date();

  trackCommand(command: string) {
    const count = this.usageData.get(command) || 0;
    this.usageData.set(command, count + 1);
  }

  trackFormatting(type: string, success: boolean, duration: number) {
    const key = `formatting.${type}.${success ? 'success' : 'failure'}`;
    this.trackCommand(key);

    // Track performance
    console.log(`Formatting ${type} took ${duration}ms`);
  }

  generateReport(): UsageReport {
    const sessionDuration = Date.now() - this.sessionStart.getTime();

    return {
      sessionDuration,
      totalCommands: Array.from(this.usageData.values()).reduce((a, b) => a + b, 0),
      commandBreakdown: Object.fromEntries(this.usageData),
      mostUsedCommand: this.getMostUsedCommand(),
      averageCommandsPerMinute: this.calculateAverageCommandsPerMinute(sessionDuration)
    };
  }

  private getMostUsedCommand(): string {
    let maxCount = 0;
    let mostUsed = '';

    for (const [command, count] of this.usageData) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = command;
      }
    }

    return mostUsed;
  }

  private calculateAverageCommandsPerMinute(sessionDuration: number): number {
    const minutes = sessionDuration / (1000 * 60);
    const totalCommands = Array.from(this.usageData.values()).reduce((a, b) => a + b, 0);
    return totalCommands / minutes;
  }
}

interface UsageReport {
  sessionDuration: number;
  totalCommands: number;
  commandBreakdown: Record<string, number>;
  mostUsedCommand: string;
  averageCommandsPerMinute: number;
}
```

### Error Monitoring

```typescript
import * as vscode from 'vscode';

export class ErrorMonitor {
  private errors: ErrorEvent[] = [];
  private maxErrors = 100;

  trackError(error: Error, context?: any) {
    const errorEvent: ErrorEvent = {
      timestamp: new Date(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      userAgent: this.getUserAgent(),
      extensionVersion: this.getExtensionVersion()
    };

    this.errors.push(errorEvent);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Report critical errors immediately
    if (this.isCriticalError(error)) {
      this.reportCriticalError(errorEvent);
    }
  }

  getErrorSummary(): ErrorSummary {
    const errorCounts = new Map<string, number>();

    for (const errorEvent of this.errors) {
      const key = `${errorEvent.error.name}: ${errorEvent.error.message}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }

    return {
      totalErrors: this.errors.length,
      uniqueErrors: errorCounts.size,
      mostCommonError: this.getMostCommonError(errorCounts),
      errorRate: this.calculateErrorRate(),
      recentErrors: this.errors.slice(-10)
    };
  }

  private isCriticalError(error: Error): boolean {
    // Define what constitutes a critical error
    const criticalPatterns = [
      /TypeError/,
      /ReferenceError/,
      /SyntaxError/,
      /command not found/
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(error.name) || pattern.test(error.message)
    );
  }

  private reportCriticalError(errorEvent: ErrorEvent) {
    // Send to error reporting service
    console.error('Critical error detected:', errorEvent);

    // Show user notification for critical errors
    vscode.window.showErrorMessage(
      `A critical error occurred: ${errorEvent.error.message}. ` +
      'Please check the developer console for details.'
    );
  }

  private getMostCommonError(errorCounts: Map<string, number>): string {
    let maxCount = 0;
    let mostCommon = '';

    for (const [error, count] of errorCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = error;
      }
    }

    return mostCommon;
  }

  private calculateErrorRate(): number {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentErrors = this.errors.filter(
      error => error.timestamp.getTime() > oneHourAgo
    );

    return recentErrors.length;
  }

  private getUserAgent(): string {
    return `VSCode/${vscode.version}`;
  }

  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension('GSejas.markdown-toolbar');
    return extension?.packageJSON?.version || 'unknown';
  }
}

interface ErrorEvent {
  timestamp: Date;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: any;
  userAgent: string;
  extensionVersion: string;
}

interface ErrorSummary {
  totalErrors: number;
  uniqueErrors: number;
  mostCommonError: string;
  errorRate: number;
  recentErrors: ErrorEvent[];
}
```

## 🔌 Extension Integration

### Third-Party Extension Integration

```typescript
import * as vscode from 'vscode';

export class ExtensionIntegrator {
  async detectConflictingExtensions(): Promise<string[]> {
    const conflictingExtensions = [
      'ms-vscode.vscode-markdown',
      'DavidAnson.vscode-markdownlint',
      'shd101wyy.markdown-preview-enhanced'
    ];

    const installedExtensions = vscode.extensions.all;
    const conflicts: string[] = [];

    for (const ext of installedExtensions) {
      if (conflictingExtensions.includes(ext.id)) {
        conflicts.push(ext.id);
      }
    }

    return conflicts;
  }

  async suggestComplementaryExtensions(): Promise<string[]> {
    const complementaryExtensions = [
      'ms-vscode.vscode-json',
      'ms-vscode.vscode-typescript-next',
      'ms-vscode.vscode-git-graph'
    ];

    const installedExtensions = vscode.extensions.all;
    const suggestions: string[] = [];

    for (const extId of complementaryExtensions) {
      const isInstalled = installedExtensions.some(ext => ext.id === extId);
      if (!isInstalled) {
        suggestions.push(extId);
      }
    }

    return suggestions;
  }

  async integrateWithMarkdownLint() {
    // Check if markdownlint is installed
    const markdownlint = vscode.extensions.getExtension('DavidAnson.vscode-markdownlint');

    if (markdownlint) {
      // Configure to work well with our extension
      const config = vscode.workspace.getConfiguration('markdownlint');

      // Disable rules that conflict with our formatting
      await config.update('config', {
        'MD013': false, // Line length
        'MD026': false, // Trailing punctuation in headings
        'MD031': false, // Blank lines around fences (we handle this)
        'MD032': false  // Blank lines around lists (we handle this)
      }, vscode.ConfigurationTarget.Workspace);
    }
  }
}
```

### Workspace Configuration

```typescript
import * as vscode from 'vscode';

export class WorkspaceConfigurator {
  async configureWorkspace() {
    // Set up recommended VS Code settings for markdown development
    const settings = {
      'editor.formatOnSave': true,
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'markdown.preview.breaks': true,
      'markdown.preview.typographer': true,
      'files.associations': {
        '*.md': 'markdown'
      },
      'emmet.includeLanguages': {
        'markdown': 'html'
      }
    };

    for (const [key, value] of Object.entries(settings)) {
      const config = vscode.workspace.getConfiguration();
      await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    }
  }

  async createWorkspaceTasks() {
    // Create tasks.json for common development tasks
    const tasks = {
      version: '2.0.0',
      tasks: [
        {
          label: 'build',
          type: 'npm',
          script: 'compile',
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'silent',
            focus: false,
            panel: 'shared'
          }
        },
        {
          label: 'test',
          type: 'npm',
          script: 'test',
          group: 'test',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'shared'
          }
        },
        {
          label: 'watch',
          type: 'npm',
          script: 'watch',
          group: 'build',
          isBackground: true,
          presentation: {
            echo: true,
            reveal: 'never',
            focus: false,
            panel: 'shared'
          }
        }
      ]
    };

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const tasksUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'tasks.json');
      await vscode.workspace.fs.writeFile(tasksUri, Buffer.from(JSON.stringify(tasks, null, 2)));
    }
  }
}
```

## 🎨 Theming and Customization

### Custom Theme Integration

```typescript
import * as vscode from 'vscode';

export class ThemeIntegrator {
  async applyThemeColors() {
    const theme = vscode.window.activeColorTheme;

    // Adapt colors based on current theme
    const colors = this.getThemeColors(theme);

    // Update status bar colors
    await this.updateStatusBarColors(colors);

    // Update button styles
    await this.updateButtonStyles(colors);
  }

  private getThemeColors(theme: vscode.ColorTheme): ThemeColors {
    const isDark = theme.kind === vscode.ColorThemeKind.Dark;

    return {
      primary: isDark ? '#007acc' : '#005a9e',
      secondary: isDark ? '#3c3c3c' : '#f3f3f3',
      accent: isDark ? '#0e70c0' : '#0066cc',
      text: isDark ? '#cccccc' : '#333333',
      background: isDark ? '#2d2d30' : '#f8f8f8'
    };
  }

  private async updateStatusBarColors(colors: ThemeColors) {
    const config = vscode.workspace.getConfiguration('workbench');

    await config.update('colorCustomizations', {
      'statusBar.background': colors.background,
      'statusBar.foreground': colors.text,
      'statusBarItem.activeBackground': colors.accent,
      'statusBarItem.hoverBackground': colors.secondary
    }, vscode.ConfigurationTarget.Global);
  }

  private async updateButtonStyles(colors: ThemeColors) {
    // Apply custom CSS for button styling
    const customCss = `
      .markdown-toolbar-button {
        background-color: ${colors.secondary};
        color: ${colors.text};
        border: 1px solid ${colors.primary};
      }

      .markdown-toolbar-button:hover {
        background-color: ${colors.primary};
        color: ${colors.background};
      }

      .markdown-toolbar-button.active {
        background-color: ${colors.accent};
        color: ${colors.background};
      }
    `;

    // This would require additional extension APIs for CSS injection
    // For now, we'll use VS Code's theming system
    await vscode.workspace.getConfiguration('markdownToolbar').update(
      'themeColors',
      colors,
      vscode.ConfigurationTarget.Global
    );
  }
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}
```

These examples demonstrate various integration patterns and advanced usage scenarios for the Markdown Toolbar extension APIs. Each example includes error handling, logging, and best practices for production use.
