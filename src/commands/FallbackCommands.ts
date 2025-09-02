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
      this.vscode.commands.registerCommand('mdToolbar.internal.strikethrough', () => this.toggleStrikethrough())
    );

    // Heading commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading1', () => this.toggleHeading(1))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading2', () => this.toggleHeading(2))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading3', () => this.toggleHeading(3))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading4', () => this.toggleHeading(4))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading5', () => this.toggleHeading(5))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.heading6', () => this.toggleHeading(6))
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.headingToggle', () => this.cycleHeading())
    );

    // Structure commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.blockquote', () => this.toggleBlockquote())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.horizontalRule', () => this.insertHorizontalRule())
    );

    // Code commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.code', () => this.toggleInlineCode())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.codeBlock', () => this.insertCodeBlock())
    );

    // List commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.list', () => this.toggleBulletList())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.task', () => this.toggleTaskList())
    );

    // Media commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.link', () => this.insertLink())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.image', () => this.insertImage())
    );

    // Extended commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.footnote', () => this.insertFootnote())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.mathInline', () => this.insertMathInline())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.mathBlock', () => this.insertMathBlock())
    );
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.lineBreak', () => this.insertLineBreak())
    );

    // Table commands
    context.subscriptions.push(
      this.vscode.commands.registerCommand('mdToolbar.internal.tableMenu', () => this.showTableMenu())
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

    const document = editor.document;

    await editor.edit((editBuilder: any) => {
      // Access selection inside edit callback to avoid cloning issues
      const selection = editor.selection;

      if (selection.isEmpty) {
        // Single line
        const line = document.lineAt(selection.start.line);
        const newText = this.formatter.toggleBulletList(line.text);
        editBuilder.replace(line.range, newText);
      } else {
        // Multiple lines
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        for (let i = startLine; i <= endLine; i++) {
          const line = document.lineAt(i);
          const newText = this.formatter.toggleBulletList(line.text);
          editBuilder.replace(line.range, newText);
        }
      }
    });
  }

  /**
   * Toggle task list
   * Note: selection is captured inside the edit to avoid cloning/staleness issues.
   */
  private async toggleTaskList(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((editBuilder: import('vscode').TextEditorEdit) => {
      const selection = editor.selection; // fresh
      const document = editor.document;

      if (selection.isEmpty) {
        const line = document.lineAt(selection.start.line);
        const newText = this.formatter.toggleTaskList(line.text);
        editBuilder.replace(line.range, newText);
      } else {
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        for (let i = startLine; i <= endLine; i++) {
          const line = document.lineAt(i);
          const newText = this.formatter.toggleTaskList(line.text);
          editBuilder.replace(line.range, newText);
        }
      }
    });
  }

  /**
   * Insert code block
   * Note: fetch selection inside the edit; compute caret after edit based on captured position.
   */
  private async insertCodeBlock(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    const language = await this.vscode.window.showInputBox({
      prompt: 'Enter language for code block (optional)',
      placeHolder: 'javascript, python, etc.'
    });

    const codeBlock = this.formatter.createCodeBlock(language || '');

    // We'll compute a post-edit caret if we inserted a new empty block
    let postEditSelection: import('vscode').Selection | null = null;

    await editor.edit((editBuilder: import('vscode').TextEditorEdit) => {
      const selection = editor.selection; // fresh
      const doc = editor.document;

      if (selection.isEmpty) {
        // Insert an empty block at cursor
        editBuilder.insert(selection.start, codeBlock);

        // Move caret to first line inside block (one line down from start)
        const newPos = selection.start.translate(1, 0);
        postEditSelection = new this.vscode.Selection(newPos, newPos);
      } else {
        // Wrap selected text
        const selectedText = doc.getText(selection);
        const wrapped = this.formatter.wrapInCodeBlock(selectedText, language || '');
        editBuilder.replace(selection, wrapped);
        // (No caret change for wrapped selection)
      }
    });

    if (postEditSelection) {
      editor.selection = postEditSelection;
    }
  }


  /**
   * Insert link
   */
  private async insertLink(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    // Get selected text but don't store selection reference
    const selectedText = editor.document.getText(editor.selection);

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
        // Get fresh selection reference inside edit callback
        const selection = editor.selection;
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

      await editor.edit((editBuilder: any) => {
        // Get fresh selection reference inside edit callback
        const selection = editor.selection;
        editBuilder.insert(selection.start, image);
      });
    }
  }

  /**
   * Apply text formatting (bold, italic, etc.)
   * Note: capture selection INSIDE the edit callback to avoid stale references.
   */
  private async applyFormatting(
    editor: any,
    startMarker: string,
    endMarker: string
  ): Promise<void> {
    let postEditSelection: import('vscode').Selection | null = null;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Fresh references inside the edit
      const selection = editor.selection;
      const document = editor.document;

      if (selection.isEmpty) {
        // No selection — insert markers and position cursor between them
        const position = selection.start;
        edit.insert(position, `${startMarker}${endMarker}`);

        postEditSelection = new this.vscode.Selection(
          position.translate(0, startMarker.length),
          position.translate(0, startMarker.length)
        );
      } else {
        // Selection present — wrap or unwrap
        const selectedText = document.getText(selection);
        const isFormatted =
          selectedText.startsWith(startMarker) &&
          selectedText.endsWith(endMarker) &&
          selectedText.length > startMarker.length + endMarker.length;

        if (isFormatted) {
          // Remove wrapping markers
          const unwrapped = selectedText.slice(startMarker.length, -endMarker.length);
          edit.replace(selection, unwrapped);

          // After removing markers, the inner text becomes shorter by both marker lengths
          const newEnd = selection.end.translate(0, -(startMarker.length + endMarker.length));
          postEditSelection = new this.vscode.Selection(selection.start, newEnd);
        } else {
          // Add wrapping markers
          const wrapped = `${startMarker}${selectedText}${endMarker}`;
          edit.replace(selection, wrapped);

          // Select inner text (exclude markers)
          const newStart = selection.start.translate(0, startMarker.length);
          const newEnd = selection.end.translate(0, startMarker.length);
          postEditSelection = new this.vscode.Selection(newStart, newEnd);
        }
      }
    });

    if (postEditSelection) {
      editor.selection = postEditSelection;
    }
  }


  // Heading helpers
  private async toggleHeading(level: number): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current line to avoid cloning issues
      const selection = editor.selection;
      const line = doc.lineAt(selection.start.line);
      const text = line.text;
      const regex = /^\s*(#+)\s*/;
      const m = text.match(regex);

      if (m) {
        // Replace existing heading with requested level
        const newHashes = '#'.repeat(level);
        const newText = text.replace(regex, () => `${newHashes} `);
        edit.replace(line.range, newText);
      } else {
        // Add heading to line
        const newHashes = '#'.repeat(level);
        const trimmed = text.trim();
        if (trimmed) {
          edit.replace(line.range, `${newHashes} ${trimmed}`);
        } else {
          edit.replace(line.range, `${newHashes} `);
        }
      }
    });
  }

  private async cycleHeading(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process only the first selection to avoid cloning issues
      const selection = editor.selection;
      const line = doc.lineAt(selection.start.line);
      const text = line.text;
      const m = text.match(/^\s*(#{1,6})\s*/);

      if (m) {
        const current = m[1].length;
        const next = current === 6 ? 0 : current + 1; // 0 means remove heading

        if (next === 0) {
          // Remove heading
          const newText = text.replace(/^\s*#{1,6}\s*/, '');
          edit.replace(line.range, newText);
        } else {
          // Change heading level
          const newHashes = '#'.repeat(next);
          const newText = text.replace(/^\s*#{1,6}\s*/, `${newHashes} `);
          edit.replace(line.range, newText);
        }
      } else {
        // Add level 1 heading
        const trimmed = text.trim();
        if (trimmed) {
          edit.replace(line.range, `# ${trimmed}`);
        } else {
          edit.replace(line.range, '# ');
        }
      }
    });
  }

  // Blockquote
  private async toggleBlockquote(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current line to avoid cloning issues
      const selection = editor.selection;
      const line = doc.lineAt(selection.start.line);
      const text = line.text;

      if (text.trim().startsWith('>')) {
        // Remove blockquote
        const newText = text.replace(/^\s*>\s?/, '');
        edit.replace(line.range, newText);
      } else {
        // Add blockquote
        edit.replace(line.range, `> ${text}`);
      }
    });
  }

  // Horizontal rule
  private async insertHorizontalRule(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      edit.replace(selection, '\n---\n');
    });
  }

  // Footnote
  private async insertFootnote(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    const text = doc.getText();
    const re = /\[\^(\d+)\]/g;
    let max = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > max) max = n;
    }
    const next = max + 1;
    const footnoteRef = `[^${next}]`;
    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      edit.replace(selection, footnoteRef);

      // append footnote at end
      const lastLine = doc.lineAt(doc.lineCount - 1);
      const insertPos = lastLine.range.end;
      edit.insert(insertPos, `\n\n[^${next}]: `);
    });
    // move cursor to end for convenience
    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
    const pos = lastLine.range.end;
    editor.selection = new this.vscode.Selection(pos, pos);
  }

  // Math
  private async insertMathInline(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (text.startsWith('$') && text.endsWith('$')) {
        edit.replace(selection, text.slice(1, -1));
      } else {
        edit.replace(selection, `$${text || ''}$`);
      }
    });
  }

  private async insertMathBlock(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      const text = editor.document.getText(selection) || '\n';
      // wrap in $$ blocks
      edit.replace(selection, `\n$$\n${text}\n$$\n`);
    });
  }

  // Line break
  private async insertLineBreak(): Promise<void> {
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      edit.replace(selection, '  \n');
    });
  }

  // Table quick menu
  private async showTableMenu(): Promise<void> {
    const choice = await this.vscode.window.showQuickPick([
      { label: 'Insert 2x2 table', description: 'Simple 2 columns x 2 rows' },
      { label: 'Insert header-only table', description: 'Header row with separators' }
    ] as any);
    if (!choice) return;
    const editor = this.vscode.window.activeTextEditor;
    if (!editor) return;
    const insert = choice.label === 'Insert 2x2 table'
      ? `| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |\n`
      : `| Header 1 | Header 2 |\n|---|---|\n`;
    await editor.edit((edit: import('vscode').TextEditorEdit) => {
      // Process current selection to avoid cloning issues
      const selection = editor.selection;
      edit.replace(selection, insert);
    });
  }
}