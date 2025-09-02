/**
 * @moduleName: Image Command - Image Insertion
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Image insertion command with file dialog
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: None
 * @requirementsTraceability: Image insertion support
 * @briefDescription: Handles markdown image insertion with file picker
 * @methods: execute, pasteImage
 * @contributors: Extension Team
 * @examples: Inserts ![alt](path) images from file dialog or clipboard
 * @vulnerabilitiesAssessment: Standard VS Code API usage, file path validation
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class ImageCommand {
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        // Show file picker for image
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
            }
        });

        if (!uris || uris.length === 0) {
            return;
        }

        const imageUri = uris[0];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

        // Calculate relative path if in workspace
        let imagePath: string;
        if (workspaceFolder && imageUri.fsPath.startsWith(workspaceFolder.uri.fsPath)) {
            imagePath = path.relative(
                path.dirname(editor.document.uri.fsPath),
                imageUri.fsPath
            ).replace(/\\/g, '/');
        } else {
            imagePath = imageUri.fsPath;
        }

        // Prompt for alt text
        const altText = await vscode.window.showInputBox({
            prompt: 'Enter alt text for the image',
            placeHolder: 'Description of the image'
        });

        if (altText === undefined) return;

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            editBuilder.replace(selection, `![${altText}](${imagePath})`);
        });
    }

    async pasteImage(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        // This would typically integrate with clipboard for pasted images
        // For now, we'll show a placeholder implementation
        const altText = await vscode.window.showInputBox({
            prompt: 'Enter alt text for pasted image',
            placeHolder: 'Description of the image'
        });

        if (altText === undefined) return;

        const imageName = `image-${Date.now()}.png`;

        await editor.edit(editBuilder => {
            // Access selection inside edit callback to avoid cloning issues
            const selection = editor.selection;
            editBuilder.replace(selection, `![${altText}](${imageName})`);
        });

        vscode.window.showInformationMessage(
            'Image paste: Save your clipboard image as ' + imageName + ' in your project folder.'
        );
    }
}
