/**
 * @moduleName: Code Commands - Code Formatting
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Code formatting commands for inline and block code
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Code formatting support
 * @briefDescription: Handles inline code and code block formatting
 * @methods: toggleInlineCode, insertCodeBlock
 * @contributors: Extension Team
 * @examples: Toggles `inline code` or inserts ```code blocks```
 * @vulnerabilitiesAssessment: Standard VS Code API usage
 */

import * as vscode from 'vscode';

export class CodeCommand {
    async toggleInlineCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') return;

        await editor.edit(editBuilder => {
            // NOTE: Capture fresh selection/text INSIDE the edit callback
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (text.startsWith('`') && text.endsWith('`') && text.length > 2) {
                // Remove inline code
                editBuilder.replace(selection, text.slice(1, -1));
            } else {
                // Add inline code
                editBuilder.replace(selection, `\`${text}\``);
            }
        });
    }

    async insertCodeBlock(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') return;

        // Prompt for language (can be empty string; undefined means cancel)
        const language = await vscode.window.showInputBox({
            prompt: 'Enter language for code block (optional)',
            placeHolder: 'javascript, python, etc.'
        });
        if (language === undefined) return;

        // We'll compute the caret move AFTER the edit using a value captured during the edit
        let postEditSelection: vscode.Selection | null = null;

        await editor.edit(editBuilder => {
            // NOTE: Capture fresh selection/text INSIDE the edit callback
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            const codeBlock = text.trim()
                ? `\`\`\`${language || ''}\n${text}\n\`\`\``
                : `\`\`\`${language || ''}\n\n\`\`\``;

            editBuilder.replace(selection, codeBlock);

            // If we inserted an empty block, move caret to the first line inside
            if (!text.trim()) {
                const newPosition = selection.start.translate(1, 0);
                postEditSelection = new vscode.Selection(newPosition, newPosition);
            }
        });

        if (postEditSelection) {
            editor.selection = postEditSelection;
        }
    }
}
