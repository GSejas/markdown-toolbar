/**
 * @moduleName: Code Command - Code Text Formatting Implementation
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Command implementation for inline code formatting with smart toggle behavior
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../index (ICommandContext)
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_014} (Code Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_015} (Smart Toggle Logic)
 *   {@link Requirements.REQ_COMMANDS_016} (Text Selection Handling)
 * @briefDescription: Implements the inline code formatting command with intelligent toggle behavior. Detects existing code formatting and removes it, or adds backtick syntax to selected text
 * @methods: createCodeCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Add code: Select text → `selected text`
 *   - Remove code: Cursor in `code` → code (removes formatting)
 *   - Smart toggle: Handles partial selections and existing formatting
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, text manipulation safety, proper error handling
 */

import * as vscode from 'vscode';
import { ICommandContext } from '../index';

/**
 * Creates the inline code formatting command
 * @param context Shared command context
 * @returns Disposable for the command
 */
export function createCodeCommand(context: ICommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('markdownToolbar.code', async () => {
    try {
      const editor = context.getActiveEditor();
      if (!editor || editor.document.languageId !== 'markdown') {
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      const text = document.getText();
      
      const selectionStart = document.offsetAt(selection.start);
      const selectionEnd = document.offsetAt(selection.end);

      // Format the text
      const result = context.formatter.formatCode(text, selectionStart, selectionEnd);

      // Apply the edit
      const success = await context.executeEdit((editBuilder) => {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, result.text);
      });

      if (success) {
        // Update selection
        const newStart = document.positionAt(result.selectionStart);
        const newEnd = document.positionAt(result.selectionEnd);
        editor.selection = new vscode.Selection(newStart, newEnd);
      }

    } catch (error) {
      console.error('Code command error:', error);
      context.showErrorMessage('Failed to apply code formatting');
    }
  });
}
