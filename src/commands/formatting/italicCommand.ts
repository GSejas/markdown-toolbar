/**
 * @moduleName: Italic Command - Italic Text Formatting Implementation
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Command implementation for italic text formatting with smart toggle behavior
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../index (ICommandContext)
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_011} (Italic Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_012} (Smart Toggle Logic)
 *   {@link Requirements.REQ_COMMANDS_013} (Text Selection Handling)
 * @briefDescription: Implements the italic formatting command with intelligent toggle behavior. Detects existing italic formatting and removes it, or adds italic syntax to selected text
 * @methods: createItalicCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Add italic: Select text → *selected text*
 *   - Remove italic: Cursor in *italic* → italic (removes formatting)
 *   - Smart toggle: Handles partial selections and existing formatting
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, text manipulation safety, proper error handling
 */

import * as vscode from 'vscode';
import { ICommandContext } from '../index';

/**
 * Creates the italic formatting command
 * @param context Shared command context
 * @returns Disposable for the command
 */
export function createItalicCommand(context: ICommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('markdownToolbar.italic', async () => {
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
      const result = context.formatter.formatItalic(text, selectionStart, selectionEnd);

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
      console.error('Italic command error:', error);
      context.showErrorMessage('Failed to apply italic formatting');
    }
  });
}
