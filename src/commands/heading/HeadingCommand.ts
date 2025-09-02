/**
 * @moduleName: Heading Commands - Heading Level Management
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Heading level commands for markdown documents
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Heading formatting support
 * @briefDescription: Handles heading formatting (H1-H6) and heading cycling
 * @methods: executeHeading, cycleHeading
 * @contributors: Extension Team
 * @examples: Toggles # heading levels or cycles through heading levels
 * @vulnerabilitiesAssessment: Standard VS Code API usage, line-based operations
 */

import * as vscode from 'vscode';

export class HeadingCommand {
    async executeHeading(level: number): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);

                for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
                    const line = document.lineAt(i);
                    const text = line.text;
                    const regex = /^\s*(#+)\s*/;
                    const match = text.match(regex);

                    if (match) {
                        // Replace existing heading with requested level
                        const newHashes = '#'.repeat(level);
                        const newText = text.replace(regex, () => `${newHashes} `);
                        editBuilder.replace(line.range, newText);
                    } else {
                        // Add heading to line
                        const newHashes = '#'.repeat(level);
                        const trimmed = text.trim();
                        if (trimmed) {
                            editBuilder.replace(line.range, `${newHashes} ${trimmed}`);
                        } else {
                            editBuilder.replace(line.range, `${newHashes} `);
                        }
                    }
                }
            }
        });
    }

    async cycleHeading(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const line = document.lineAt(selection.start.line);
                const text = line.text;
                const match = text.match(/^\s*(#{1,6})\s*/);

                if (match) {
                    const currentLevel = match[1].length;
                    const nextLevel = currentLevel === 6 ? 0 : currentLevel + 1;

                    if (nextLevel === 0) {
                        // Remove heading
                        const newText = text.replace(/^\s*#{1,6}\s*/, '');
                        editBuilder.replace(line.range, newText);
                    } else {
                        // Change heading level
                        const newHashes = '#'.repeat(nextLevel);
                        const newText = text.replace(/^\s*#{1,6}\s*/, `${newHashes} `);
                        editBuilder.replace(line.range, newText);
                    }
                } else {
                    // Add H1 heading
                    const trimmed = text.trim();
                    if (trimmed) {
                        editBuilder.replace(line.range, `# ${trimmed}`);
                    } else {
                        editBuilder.replace(line.range, '# ');
                    }
                }
            }
        });
    }
}
