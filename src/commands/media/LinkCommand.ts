/**
 * @moduleName: Link Command - Link Insertion and Management
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Link insertion and management command
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Link formatting support
 * @briefDescription: Handles markdown link insertion and editing
 * @methods: execute
 * @contributors: Extension Team
 * @examples: Inserts [text](url) links or edits existing links
 * @vulnerabilitiesAssessment: Standard VS Code API usage, user input validation
 */

import * as vscode from 'vscode';

export class LinkCommand {
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        // Get selected text without storing selection reference
        const selectedText = editor.document.getText(editor.selection);

        // Check if selection is already a link
        const linkMatch = selectedText.match(/^\[([^\]]*)\]\(([^)]*)\)$/);

        if (linkMatch) {
            // Edit existing link
            const currentText = linkMatch[1];
            const currentUrl = linkMatch[2];

            const newText = await vscode.window.showInputBox({
                prompt: 'Enter link text',
                value: currentText
            });

            if (newText === undefined) return;

            const newUrl = await vscode.window.showInputBox({
                prompt: 'Enter URL',
                value: currentUrl
            });

            if (newUrl === undefined) return;

            await editor.edit(editBuilder => {
                // Use fresh selection reference inside edit callback
                const selection = editor.selection;
                editBuilder.replace(selection, `[${newText}](${newUrl})`);
            });
        } else {
            // Create new link
            const linkText = selectedText || await vscode.window.showInputBox({
                prompt: 'Enter link text',
                value: selectedText
            });

            if (linkText === undefined) return;

            const url = await vscode.window.showInputBox({
                prompt: 'Enter URL',
                placeHolder: 'https://example.com'
            });

            if (url === undefined) return;

            await editor.edit(editBuilder => {
                // Use fresh selection reference inside edit callback
                const selection = editor.selection;
                editBuilder.replace(selection, `[${linkText}](${url})`);
            });
        }
    }
}
