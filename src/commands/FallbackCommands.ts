/**
 * @moduleName: Fallback Commands - Internal Command Implementations
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Internal command implementations for graceful degradation when external extensions are unavailable
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../engine/MarkdownFormatter
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_005} (Fallback Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_006} (Graceful Degradation)
 *   {@link Requirements.REQ_COMMANDS_007} (Internal Formatting Logic)
 * @briefDescription: Provides internal implementations of markdown formatting commands when external extensions are not available. Ensures the toolbar remains functional with basic formatting capabilities
 * @methods: registerAll, toggleBold, toggleItalic, toggleStrikethrough, toggleList, insertLink
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Fallback bold: Internal implementation when MAIO unavailable
 *   - Graceful degradation: Basic functionality without external dependencies
 *   - Command registration: Automatic fallback command setup
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, error handling, no external network access
 */

import { MarkdownFormatter } from '../engine/MarkdownFormatter';

/**
 * Internal fallback implementations when extensions aren't available
 */
export class FallbackCommands {
  private vscode: any;
  private formatter: MarkdownFormatter;

  constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
    this.formatter = new MarkdownFormatter();
  }

  /**
   * Register all internal fallback commands
   */
  public registerAll(context: any): void {
    // Format commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.bold', () => this.toggleBold())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.italic', () => this.toggleItalic())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.strike', () => this.toggleStrikethrough())
    );

    // List commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.list', () => this.toggleBulletList())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.task', () => this.toggleTaskList())
    );

    // Code commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.code.inline', () => this.toggleInlineCode())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.code.block', () => this.insertCodeBlock())
    );

    // Link and image commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.link', () => this.insertLink())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.image', () => this.insertImage())
    );
  }

  /**
   * Toggle bold formatting
   */
  private async toggleBold(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await this.applyFormatting(editor, '**', '**');
  }

  /**
   * Toggle italic formatting
   */
  private async toggleItalic(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await this.applyFormatting(editor, '*', '*');
  }

  /**
   * Toggle strikethrough formatting
   */
  private async toggleStrikethrough(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await this.applyFormatting(editor, '~~', '~~');
  }

  /**
   * Toggle inline code formatting
   */
  private async toggleInlineCode(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await this.applyFormatting(editor, '`', '`');
  }

  /**
   * Toggle bullet list
   */
  private async toggleBulletList(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const document = editor.document;

    if (selection.isEmpty) {
      // Single line
      const line = document.lineAt(selection.start.line);
      const newText = this.formatter.toggleBulletList(line.text);

      await editor.edit((editBuilder: any) => {
        editBuilder.replace(line.range, newText);
      });
    } else {
      // Multiple lines
      const startLine = selection.start.line;
      const endLine = selection.end.line;

      await editor.edit((editBuilder: any) => {
        for (let i = startLine; i <= endLine; i++) {
          const line = document.lineAt(i);
          const newText = this.formatter.toggleBulletList(line.text);
          editBuilder.replace(line.range, newText);
        }
      });
    }
  }

  /**
   * Toggle task list
   */
  private async toggleTaskList(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const document = editor.document;

    if (selection.isEmpty) {
      // Single line
      const line = document.lineAt(selection.start.line);
      const newText = this.formatter.toggleTaskList(line.text);

      await editor.edit((editBuilder: any) => {
        editBuilder.replace(line.range, newText);
      });
    } else {
      // Multiple lines
      const startLine = selection.start.line;
      const endLine = selection.end.line;

      await editor.edit((editBuilder: any) => {
        for (let i = startLine; i <= endLine; i++) {
          const line = document.lineAt(i);
          const newText = this.formatter.toggleTaskList(line.text);
          editBuilder.replace(line.range, newText);
        }
      });
    }
  }

  /**
   * Insert code block
   */
  private async insertCodeBlock(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    // Ask for language
    const language = await this.vscode.window.showInputBox({
      prompt: 'Enter language for code block (optional)',
      placeHolder: 'javascript, python, etc.'
    });

    const codeBlock = this.formatter.createCodeBlock(language || '');
    const selection = editor.selection;

    await editor.edit((editBuilder: any) => {
      if (selection.isEmpty) {
        editBuilder.insert(selection.start, codeBlock);
      } else {
        const selectedText = editor.document.getText(selection);
        const wrappedCode = this.formatter.wrapInCodeBlock(selectedText, language || '');
        editBuilder.replace(selection, wrappedCode);
      }
    });

    // Move cursor to inside the code block
    if (selection.isEmpty) {
      const newPosition = selection.start.translate(1, 0);
      editor.selection = new this.vscode.Selection(newPosition, newPosition);
    }
  }

  /**
   * Insert link
   */
  private async insertLink(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    let linkText = selectedText;
    let url = '';

    if (!linkText) {
      linkText = await this.vscode.window.showInputBox({
        prompt: 'Enter link text',
        placeHolder: 'Link text'
      }) || '';
    }

    if (linkText) {
      url = await this.vscode.window.showInputBox({
        prompt: 'Enter URL',
        placeHolder: 'https://example.com'
      }) || '';
    }

    if (linkText && url) {
      const link = this.formatter.createLink(linkText, url);

      await editor.edit((editBuilder: any) => {
        if (selection.isEmpty) {
          editBuilder.insert(selection.start, link);
        } else {
          editBuilder.replace(selection, link);
        }
      });
    }
  }

  /**
   * Insert image
   */
  private async insertImage(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    const altText = await this.vscode.window.showInputBox({
      prompt: 'Enter image alt text',
      placeHolder: 'Alt text'
    }) || '';

    const url = await this.vscode.window.showInputBox({
      prompt: 'Enter image URL',
      placeHolder: 'https://example.com/image.png'
    }) || '';

    if (url) {
      const image = this.formatter.createImage(altText, url);
      const selection = editor.selection;

      await editor.edit((editBuilder: any) => {
        editBuilder.insert(selection.start, image);
      });
    }
  }

  /**
   * Apply text formatting (bold, italic, etc.)
   */
  private async applyFormatting(
    editor: any,
    startMarker: string,
    endMarker: string
  ): Promise<void> {
    const selection = editor.selection;
    const document = editor.document;

    if (selection.isEmpty) {
      // No selection - insert markers and position cursor
      const position = selection.start;
      const text = `${startMarker}${endMarker}`;

      await editor.edit((editBuilder: any) => {
        editBuilder.insert(position, text);
      });

      // Position cursor between markers
      const newPosition = position.translate(0, startMarker.length);
      editor.selection = new this.vscode.Selection(newPosition, newPosition);
    } else {
      // Has selection - wrap or unwrap
      const selectedText = document.getText(selection);
      const isFormatted = selectedText.startsWith(startMarker) &&
        selectedText.endsWith(endMarker) &&
        selectedText.length > startMarker.length + endMarker.length;

      let newText: string;
      if (isFormatted) {
        // Remove formatting
        newText = selectedText.slice(startMarker.length, -endMarker.length);
      } else {
        // Add formatting
        newText = `${startMarker}${selectedText}${endMarker}`;
      }

      await editor.edit((editBuilder: any) => {
        editBuilder.replace(selection, newText);
      });

      // Adjust selection
      if (!isFormatted) {
        const start = selection.start.translate(0, startMarker.length);
        const end = selection.end.translate(0, startMarker.length);
        editor.selection = new this.vscode.Selection(start, end);
      }
    }
  }
}