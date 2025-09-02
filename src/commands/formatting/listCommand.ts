/**
 * @moduleName: List Command - List Formatting Implementation
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Command implementation for markdown list formatting with line-based operations
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../index (ICommandContext)
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_020} (List Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_021} (Line-based Operations)
 *   {@link Requirements.REQ_COMMANDS_022} (List Type Detection)
 * @briefDescription: Implements the list formatting command with line-based operations. Expands selection to full lines and handles different list types (bullets, numbers) with normalization
 * @methods: createListCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Add list: Select lines → - Line 1\n- Line 2
 *   - Remove list: Cursor on - item → item (removes list formatting)
 *   - List normalization: Mixed list types → Consistent bullet style
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, line-based operation safety, proper error handling
 */

import * as vscode from 'vscode';
import { ICommandContext } from '../index';

/**
 * Creates the list formatting command
 * @param context Shared command context
 * @returns Disposable for the command
 */
export function createListCommand(context: ICommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('markdownToolbar.list', async () => {
    try {
      const editor = context.getActiveEditor();
      if (!editor || editor.document.languageId !== 'markdown') {
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      const text = document.getText();
      
      let selectionStart = document.offsetAt(selection.start);
      let selectionEnd = document.offsetAt(selection.end);

      // If no selection, select the current line
      if (selectionStart === selectionEnd) {
        const currentLine = context.detector.getLineAt(text, selectionStart);
        selectionStart = currentLine.start;
        selectionEnd = currentLine.end;
      } else {
        // Expand selection to include full lines
        const startLine = context.detector.getLineAt(text, selectionStart);
        const endLine = context.detector.getLineAt(text, selectionEnd);
        selectionStart = startLine.start;
        selectionEnd = endLine.end;
      }

      // Check if user wants bullet or numbered list
      const listTypeChoice = await vscode.window.showQuickPick([
        {
          label: '$(list-unordered) Bullet List',
          description: 'Create or toggle bullet list',
          value: 'bullet' as const
        },
        {
          label: '$(list-ordered) Numbered List', 
          description: 'Create or toggle numbered list',
          value: 'numbered' as const
        }
      ], {
        placeHolder: 'Select list type'
      });

      if (!listTypeChoice) {
        return; // User cancelled
      }

      // Format the text
      const result = context.formatter.formatList(text, selectionStart, selectionEnd, listTypeChoice.value);

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
      console.error('List command error:', error);
      context.showErrorMessage('Failed to format list');
    }
  });
}
