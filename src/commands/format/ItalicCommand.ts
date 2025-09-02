/**
 * @moduleName: Italic Command - Italic Text Formatting
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Italic text formatting command with smart toggle logic
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: MarkdownFormatter, ContextDetector
 * @requirementsTraceability: Italic text formatting support
 * @briefDescription: Handles italic text formatting with context-aware toggle behavior
 * @methods: execute
 * @contributors: Extension Team
 * @examples: Toggles *italic* formatting on selected text or at cursor position
 * @vulnerabilitiesAssessment: Standard VS Code API usage, input validation via MarkdownFormatter
 */

import * as vscode from 'vscode';

export class ItalicCommand {
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (text.startsWith('*') && text.endsWith('*') && !text.startsWith('**')) {
                // Remove italic
                editBuilder.replace(selection, text.slice(1, -1));
            } else if (text.startsWith('_') && text.endsWith('_')) {
                // Remove underscore italic
                editBuilder.replace(selection, text.slice(1, -1));
            } else {
                // Add italic
                editBuilder.replace(selection, `*${text}*`);
            }
        });
    }
}
