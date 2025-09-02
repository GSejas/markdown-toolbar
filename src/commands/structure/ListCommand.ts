/**
 * @moduleName: List Commands - List Formatting
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: List formatting commands for bullet and task lists
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: List formatting support
 * @briefDescription: Handles bullet list and task list formatting with toggle behavior
 * @methods: toggleBulletList, toggleTaskList
 * @contributors: Extension Team
 * @examples: Toggles - bullet lists or - [ ] task lists
 * @vulnerabilitiesAssessment: Standard VS Code API usage, line-based operations
 */

import * as vscode from 'vscode';

export class ListCommand {
    async toggleBulletList(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);

                // Check if all lines are already bullet lists
                let allBullets = true;
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    if (!line.text.trim().match(/^[-*+]\s/)) {
                        allBullets = false;
                        break;
                    }
                }

                // Toggle bullet list on all lines
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    const text = line.text;

                    if (allBullets) {
                        // Remove bullet list
                        const newText = text.replace(/^\s*[-*+]\s/, '');
                        editBuilder.replace(line.range, newText);
                    } else {
                        // Add bullet list
                        const trimmed = text.trim();
                        if (trimmed) {
                            editBuilder.replace(line.range, `- ${trimmed}`);
                        } else {
                            editBuilder.replace(line.range, '- ');
                        }
                    }
                }
            }
        });
    }

    async toggleTaskList(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);

                // Check if all lines are already task lists
                let allTasks = true;
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    if (!line.text.trim().match(/^-\s\[[ x]\]\s/)) {
                        allTasks = false;
                        break;
                    }
                }

                // Toggle task list on all lines
                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    const text = line.text;

                    if (allTasks) {
                        // Remove task list
                        const newText = text.replace(/^\s*-\s\[[ x]\]\s/, '');
                        editBuilder.replace(line.range, newText);
                    } else {
                        // Add task list
                        const trimmed = text.trim();
                        if (trimmed) {
                            editBuilder.replace(line.range, `- [ ] ${trimmed}`);
                        } else {
                            editBuilder.replace(line.range, '- [ ] ');
                        }
                    }
                }
            }
        });
    }
}
