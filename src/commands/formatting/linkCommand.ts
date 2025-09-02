/**
 * @moduleName: Link Command - Link Insertion and Formatting Implementation
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Command implementation for markdown link insertion with URL extraction
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../index (ICommandContext)
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_017} (Link Command Implementation)
 *   {@link Requirements.REQ_COMMANDS_018} (URL Extraction Logic)
 *   {@link Requirements.REQ_COMMANDS_019} (Link Formatting)
 * @briefDescription: Implements the link insertion command with intelligent URL extraction. When removing links, extracts and displays the URL to the user for reference
 * @methods: createLinkCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Insert link: [text](url) with user input prompts
 *   - Remove link: Cursor in [text](url) → text (shows URL in notification)
 *   - URL extraction: Preserves link URLs when removing link formatting
 * @vulnerabilitiesAssessment: VS Code API sandboxing, input validation, URL sanitization, user notification handling
 */

import * as vscode from 'vscode';
import { ICommandContext } from '../index';

/**
 * Creates the link formatting command
 * @param context Shared command context
 * @returns Disposable for the command
 */
export function createLinkCommand(context: ICommandContext): vscode.Disposable {
    return vscode.commands.registerCommand('markdownToolbar.link', async () => {
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
            const selectedText = text.substring(selectionStart, selectionEnd);

            // Detect if we're in an existing link
            const markdownContext = context.detector.detectContext(text, selectionStart, selectionEnd);

            let url: string | undefined;

            if (markdownContext.isLink) {
                // If we're in a link, just remove it and show the extracted URL
                const result = context.formatter.formatLink(text, selectionStart, selectionEnd);

                // Apply the edit
                const success = await context.executeEdit((editBuilder) => {
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length)
                    );
                    editBuilder.replace(fullRange, result.text);
                });

                if (success) {
                    // Update selection and show extracted URL
                    const newStart = document.positionAt(result.selectionStart);
                    const newEnd = document.positionAt(result.selectionEnd);
                    editor.selection = new vscode.Selection(newStart, newEnd);

                    if (result.extractedUrl) {
                        vscode.window.showInformationMessage(`Extracted URL: ${result.extractedUrl}`);
                    }
                }
                return;
            }

            // If text is selected, prompt for URL
            if (selectedText) {
                url = await context.showInputBox({
                    prompt: 'Enter URL for the link',
                    placeHolder: 'https://example.com',
                    validateInput: (value) => {
                        if (!value || value.trim() === '') {
                            return 'URL cannot be empty';
                        }
                        if (!context.formatter.isValidUrl(value.trim())) {
                            return 'Please enter a valid URL';
                        }
                        return null;
                    }
                });

                if (!url) {
                    return; // User cancelled
                }
            }

            // Format the text
            const result = context.formatter.formatLink(text, selectionStart, selectionEnd, url);

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
            console.error('Link command error:', error);
            context.showErrorMessage('Failed to create link');
        }
    });
}
