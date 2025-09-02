/**
 * @moduleName: Extended Commands - Advanced Markdown Features
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Extended markdown commands for footnotes, math, and special formatting
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Extended markdown feature support
 * @briefDescription: Handles footnotes, math expressions, horizontal rules, and line breaks
 * @methods: insertFootnote, insertMathInline, insertMathBlock, insertHorizontalRule, insertLineBreak
 * @contributors: Extension Team
 * @examples: Inserts [^1] footnotes, $math$ expressions, --- rules, and line breaks
 * @vulnerabilitiesAssessment: Standard VS Code API usage, document parsing for footnote numbering
 */

import * as vscode from 'vscode';

export class ExtendedCommand {
    async insertFootnote(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const document = editor.document;
        const text = document.getText();

        // Find the next footnote number
        const footnoteMatches = text.match(/\[\^(\d+)\]/g) || [];
        const numbers = footnoteMatches.map(match => parseInt(match.match(/\d+/)![0], 10));
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

        const footnoteRef = `[^${nextNumber}]`;

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            // Insert footnote reference at cursor
            editBuilder.replace(selection, footnoteRef);

            // Add footnote definition at end of document
            const lastLine = document.lineAt(document.lineCount - 1);
            const insertPosition = lastLine.range.end;
            editBuilder.insert(insertPosition, `\n\n[^${nextNumber}]: `);
        });

        // Move cursor to footnote definition
        const newLastLine = editor.document.lineAt(editor.document.lineCount - 1);
        const endPosition = newLastLine.range.end;
        editor.selection = new vscode.Selection(endPosition, endPosition);
    }

    async insertMathInline(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (text.startsWith('$') && text.endsWith('$') && text.length > 2) {
                // Remove math
                editBuilder.replace(selection, text.slice(1, -1));
            } else {
                // Add math
                editBuilder.replace(selection, `$${text}$`);
            }
        });
    }

    async insertMathBlock(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        let textWasEmpty = false;
        let originalSelection: any;

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            textWasEmpty = !text.trim();
            originalSelection = selection;

            const mathBlock = text.trim()
                ? `\n$$\n${text}\n$$\n`
                : `\n$$\n\n$$\n`;

            editBuilder.replace(selection, mathBlock);
        });

        // Position cursor inside math block if it was empty
        if (textWasEmpty && originalSelection) {
            const newPosition = originalSelection.start.translate(2, 0);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        }
    }

    async insertHorizontalRule(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            editBuilder.replace(selection, '\n---\n');
        });
    }

    async insertLineBreak(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            editBuilder.replace(selection, '  \n');
        });
    }
}
