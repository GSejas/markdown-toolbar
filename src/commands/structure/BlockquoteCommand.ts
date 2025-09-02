/**
 * @moduleName: Blockquote Command - Blockquote Formatting
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Blockquote formatting command with toggle behavior
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Blockquote formatting support
 * @briefDescription: Handles blockquote formatting with line-based toggle behavior
 * @methods: execute
 * @contributors: Extension Team
 * @examples: Toggles > blockquote formatting on selected lines
 * @vulnerabilitiesAssessment: Standard VS Code API usage, line-based operations
 */

import * as vscode from 'vscode';

export class BlockquoteCommand {
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);

                // Check if all lines are already blockquoted
                let allQuoted = true;
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    if (!line.text.trim().startsWith('>')) {
                        allQuoted = false;
                        break;
                    }
                }

                // Toggle blockquote on all lines
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    const text = line.text;

                    if (allQuoted) {
                        // Remove blockquote
                        const newText = text.replace(/^\s*>\s?/, '');
                        editBuilder.replace(line.range, newText);
                    } else {
                        // Add blockquote
                        if (text.trim()) {
                            editBuilder.replace(line.range, `> ${text}`);
                        } else {
                            editBuilder.replace(line.range, '> ');
                        }
                    }
                }
            }
        });
    }
}
