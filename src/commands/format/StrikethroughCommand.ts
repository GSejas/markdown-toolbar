/**
 * @moduleName: Strikethrough Command - Strikethrough Text Formatting
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Strikethrough text formatting command
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Strikethrough text formatting support
 * @briefDescription: Handles strikethrough text formatting with toggle behavior
 * @methods: execute
 * @contributors: Extension Team
 * @examples: Toggles ~~strikethrough~~ formatting on selected text
 * @vulnerabilitiesAssessment: Standard VS Code API usage
 */

import * as vscode from 'vscode';

export class StrikethroughCommand {
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (text.startsWith('~~') && text.endsWith('~~')) {
                // Remove strikethrough
                editBuilder.replace(selection, text.slice(2, -2));
            } else {
                // Add strikethrough
                editBuilder.replace(selection, `~~${text}~~`);
            }
        });
    }
}
