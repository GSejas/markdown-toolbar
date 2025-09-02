/**
 * @moduleName: Bold Command - Bold Text Formatting Implementation
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Command implementation for bold text formatting with smart toggle behavior
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../index (ICommandContext)
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_008} (Bold Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_009} (Smart Toggle Logic)
 *   {@link Requirements.REQ_COMMANDS_010} (Text Selection Handling)
 * @briefDescription: Implements the bold formatting command with intelligent toggle behavior. Detects existing bold formatting and removes it, or adds bold syntax to selected text with proper cursor positioning
 * @methods: createBoldCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Add bold: Select text → **selected text**
 *   - Remove bold: Cursor in **bold** → bold (removes formatting)
 *   - Smart toggle: Handles partial selections and existing formatting
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, text manipulation safety, proper error handling
 */

import * as vscode from 'vscode';
import { ICommandContext } from '../index';

/**
 * Creates the bold formatting command
 * @param context Shared command context
 * @returns Disposable for the command
 */
export function createBoldCommand(context: ICommandContext): vscode.Disposable {
    return vscode.commands.registerCommand('markdownToolbar.bold', async () => {
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
            const result = context.formatter.formatBold(text, selectionStart, selectionEnd);

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
            console.error('Bold command error:', error);
            context.showErrorMessage('Failed to apply bold formatting');
        }
    });
}
