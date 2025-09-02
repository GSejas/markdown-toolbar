/**
 * @moduleName: Header Commands - H+ and H- Level Adjustment
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: VS Code commands for adjusting markdown header levels with context awareness
 * @techStack: TypeScript, VS Code API, Markdown Engine Integration
 * @dependency: vscode, markdown-preview-enhanced (optional)
 * @interModuleDependency: ../engine/ContextDetector, ../engine/MarkdownFormatter
 * @requirementsTraceability:
 *   {@link Requirements.REQ_HEADER_001} (Header Level Adjustment)
 *   {@link Requirements.REQ_HEADER_002} (TOC Integration)
 * @briefDescription: Implements H+ (bigger) and H- (smaller) header level adjustment commands with sophisticated context detection, TOC integration, and external extension support with minimalist fallbacks
 * @methods: increaseHeaderLevel, decreaseHeaderLevel, addToToc, navigateHeaders
 * @contributors: VS Code Extension Team
 * @examples:
 *   - H+ on "## Section" → "# Section" (bigger header)
 *   - H- on "# Title" → "## Title" (smaller header)
 *   - TOC integration with external markdown extensions
 * @vulnerabilitiesAssessment: Text manipulation validation, document range checking, external extension integration security
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { MarkdownFormatter } from '../engine/MarkdownFormatter';
import { logger } from '../services/Logger';

interface HeaderCommandArgs {
    uri?: string;
    line?: number;
    currentLevel?: number;
}

interface TocCommandArgs {
    content: string;
    level: number;
}

export class HeaderCommands {
    private contextDetector: ContextDetector;
    private formatter: MarkdownFormatter;

    constructor(contextDetector: ContextDetector, formatter: MarkdownFormatter) {
        this.contextDetector = contextDetector;
        this.formatter = formatter;
    }

    /**
     * Register all header-related commands
     */
    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // H+ (increase header level - make bigger)
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.increaseHeaderLevel',
            (args?: HeaderCommandArgs) => this.increaseHeaderLevel(args)
        ));

        // H- (decrease header level - make smaller)
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.decreaseHeaderLevel',
            (args?: HeaderCommandArgs) => this.decreaseHeaderLevel(args)
        ));

        // Add to Table of Contents
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.addToToc',
            (args?: TocCommandArgs) => this.addToToc(args)
        ));

        // Navigate headers
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.navigateHeaders',
            (args?: any) => this.navigateHeaders(args)
        ));

        return disposables;
    }

    /**
     * H+ - Increase header level (make bigger)
     */
    private async increaseHeaderLevel(args?: HeaderCommandArgs): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'markdown') {
                return;
            }

            const document = editor.document;
            const position = args?.line !== undefined
                ? new vscode.Position(args.line, 0)
                : editor.selection.active;

            const line = document.lineAt(position.line);
            const lineText = line.text;

            // Detect current header level
            const headerMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
            if (!headerMatch) {
                logger.warn('No header found at specified position');
                return;
            }

            const [, currentHashes, content] = headerMatch;
            const currentLevel = currentHashes.length;

            // Can't make bigger than H1
            if (currentLevel <= 1) {
                vscode.window.showInformationMessage('Already at maximum header level (H1)');
                return;
            }

            // Create new header with fewer hashes (bigger)
            const newLevel = currentLevel - 1;
            const newHashes = '#'.repeat(newLevel);
            const newLineText = `${newHashes} ${content}`;

            // Apply the change
            await editor.edit(editBuilder => {
                editBuilder.replace(line.range, newLineText);
            });

            logger.info(`Header level increased from H${currentLevel} to H${newLevel}`);

            // Show success message
            vscode.window.showInformationMessage(
                `Header promoted to H${newLevel} (${this.getHeaderLevelName(newLevel)})`
            );

        } catch (error) {
            logger.error('Failed to increase header level', error);
            vscode.window.showErrorMessage('Failed to increase header level');
        }
    }

    /**
     * H- - Decrease header level (make smaller)
     */
    private async decreaseHeaderLevel(args?: HeaderCommandArgs): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'markdown') {
                return;
            }

            const document = editor.document;
            const position = args?.line !== undefined
                ? new vscode.Position(args.line, 0)
                : editor.selection.active;

            const line = document.lineAt(position.line);
            const lineText = line.text;

            // Detect current header level
            const headerMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
            if (!headerMatch) {
                logger.warn('No header found at specified position');
                return;
            }

            const [, currentHashes, content] = headerMatch;
            const currentLevel = currentHashes.length;

            // Can't make smaller than H6
            if (currentLevel >= 6) {
                vscode.window.showInformationMessage('Already at minimum header level (H6)');
                return;
            }

            // Create new header with more hashes (smaller)
            const newLevel = currentLevel + 1;
            const newHashes = '#'.repeat(newLevel);
            const newLineText = `${newHashes} ${content}`;

            // Apply the change
            await editor.edit(editBuilder => {
                editBuilder.replace(line.range, newLineText);
            });

            logger.info(`Header level decreased from H${currentLevel} to H${newLevel}`);

            // Show success message
            vscode.window.showInformationMessage(
                `Header demoted to H${newLevel} (${this.getHeaderLevelName(newLevel)})`
            );

        } catch (error) {
            logger.error('Failed to decrease header level', error);
            vscode.window.showErrorMessage('Failed to decrease header level');
        }
    }

    /**
     * Add header to Table of Contents
     * Prioritizes external extensions, falls back to internal implementation
     */
    private async addToToc(args?: TocCommandArgs): Promise<void> {
        try {
            // First, try external TOC extensions (in order of preference)
            const tocExtensions = [
                'markdown-preview-enhanced.insertTableOfContents',
                'yzhang.markdown-all-in-one.createToc',
                'bierner.markdown-preview-github-styles.insertToc'
            ];

            for (const tocCommand of tocExtensions) {
                try {
                    const extension = vscode.extensions.getExtension(tocCommand.split('.')[0]);
                    if (extension) {
                        await vscode.commands.executeCommand(tocCommand);
                        logger.info(`TOC inserted using external extension: ${tocCommand}`);
                        return;
                    }
                } catch (error) {
                    logger.debug(`External TOC command failed: ${tocCommand}`, error);
                }
            }

            // Fallback: Internal TOC generation
            await this.internalTocGeneration(args);

        } catch (error) {
            logger.error('Failed to add to TOC', error);
            vscode.window.showErrorMessage('Failed to add to Table of Contents');
        }
    }

    /**
     * Navigate between headers
     */
    private async navigateHeaders(args?: any): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'markdown') {
                return;
            }

            // Try external outline navigation first
            const outlineCommands = [
                'outline.focus',
                'markdown.extension.onMoveToNextHeading',
                'markdownShortcuts.showAll'
            ];

            for (const command of outlineCommands) {
                try {
                    await vscode.commands.executeCommand(command);
                    logger.info(`Header navigation using: ${command}`);
                    return;
                } catch (error) {
                    logger.debug(`Navigation command failed: ${command}`, error);
                }
            }

            // Fallback: Internal header navigation
            await this.internalHeaderNavigation();

        } catch (error) {
            logger.error('Failed to navigate headers', error);
            vscode.window.showErrorMessage('Failed to navigate headers');
        }
    }

    /**
     * Internal TOC generation (minimalist fallback)
     */
    private async internalTocGeneration(args?: TocCommandArgs): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');

        // Extract all headers
        const headers: Array<{ level: number; content: string; line: number }> = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                const [, hashes, content] = headerMatch;
                headers.push({
                    level: hashes.length,
                    content: content.trim(),
                    line: i
                });
            }
        }

        if (headers.length === 0) {
            vscode.window.showInformationMessage('No headers found in document');
            return;
        }

        // Generate TOC markdown
        let tocMarkdown = '## Table of Contents\n\n';
        for (const header of headers) {
            const indent = '  '.repeat(header.level - 1);
            const anchor = header.content.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-');
            tocMarkdown += `${indent}- [${header.content}](#${anchor})\n`;
        }

        // Insert TOC at cursor position
        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, tocMarkdown + '\n');
        });

        logger.info('Internal TOC generated successfully');
        vscode.window.showInformationMessage('Table of Contents inserted');
    }

    /**
     * Internal header navigation (minimalist fallback)
     */
    private async internalHeaderNavigation(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');

        // Extract all headers with their positions
        const headers: vscode.QuickPickItem[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                const [, hashes, content] = headerMatch;
                const level = hashes.length;
                const indent = '  '.repeat(level - 1);
                headers.push({
                    label: `${indent}${content}`,
                    detail: `Line ${i + 1} - H${level}`,
                    description: hashes
                });
            }
        }

        if (headers.length === 0) {
            vscode.window.showInformationMessage('No headers found in document');
            return;
        }

        // Show header picker
        const selected = await vscode.window.showQuickPick(headers, {
            placeHolder: 'Select a header to navigate to',
            matchOnDetail: true,
            matchOnDescription: true
        });

        if (selected) {
            const lineMatch = selected.detail?.match(/Line (\d+)/);
            if (lineMatch) {
                const lineNumber = parseInt(lineMatch[1]) - 1;
                const position = new vscode.Position(lineNumber, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        }
    }

    /**
     * Get human-readable header level name
     */
    private getHeaderLevelName(level: number): string {
        const names = ['', 'Title', 'Section', 'Subsection', 'Sub-subsection', 'Minor', 'Minimal'];
        return names[level] || 'Header';
    }
}
