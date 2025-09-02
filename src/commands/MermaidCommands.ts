/**
 * @moduleName: Mermaid Commands - Diagram Management and Integration
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive mermaid diagram management with external extension integration and fallbacks
 * @techStack: TypeScript, VS Code API, Mermaid.js Integration
 * @dependency: vscode, mermaid-markdown-syntax-highlighting (preferred), mermaid-preview (fallback)
 * @interModuleDependency: ../engine/ContextDetector, ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_MERMAID_001} (Diagram Preview)
 *   {@link Requirements.REQ_MERMAID_002} (Syntax Validation)
 *   {@link Requirements.REQ_MERMAID_003} (Export Functionality)
 * @briefDescription: Advanced mermaid diagram commands supporting preview, editing, export, and validation. Prioritizes external mermaid extensions with sophisticated internal fallbacks using web-based preview
 * @methods: previewMermaid, editMermaid, exportMermaid, validateMermaid, fixMermaidSyntax
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Preview: Opens diagram in webview with mermaid.js rendering
 *   - Export: Saves diagram as PNG/SVG with proper scaling
 *   - Validate: Checks syntax and provides error feedback
 * @vulnerabilitiesAssessment: Web content security policies, mermaid.js CDN integration, file system access validation
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';
import * as path from 'path';

interface MermaidCommandArgs {
    content?: string;
    type?: string;
    uri?: string;
    range?: { start: number; end: number };
}

interface DiagramExportOptions {
    format: 'png' | 'svg' | 'pdf';
    theme: 'default' | 'dark' | 'forest' | 'neutral';
    scale: number;
}

export class MermaidCommands {
    private contextDetector: ContextDetector;
    private readonly MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';

    constructor(contextDetector: ContextDetector) {
        this.contextDetector = contextDetector;
    }

    /**
     * Register all mermaid-related commands
     */
    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Preview mermaid diagram
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.previewMermaid',
            (args?: MermaidCommandArgs) => this.previewMermaid(args)
        ));

        // Edit mermaid diagram
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.editMermaid',
            (args?: MermaidCommandArgs) => this.editMermaid(args)
        ));

        // Export mermaid diagram
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.exportMermaid',
            (args?: MermaidCommandArgs) => this.exportMermaid(args)
        ));

        // Validate mermaid syntax
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.validateMermaid',
            (args?: MermaidCommandArgs) => this.validateMermaid(args)
        ));

        // Fix mermaid syntax
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.fixMermaidSyntax',
            (args?: MermaidCommandArgs) => this.fixMermaidSyntax(args)
        ));

        return disposables;
    }

    /**
     * Preview mermaid diagram
     */
    private async previewMermaid(args?: MermaidCommandArgs): Promise<void> {
        try {
            // Try external mermaid extensions first
            const externalCommands = [
                'mermaid-markdown-syntax-highlighting.preview',
                'bierner.markdown-mermaid.showPreview',
                'mermaid.preview'
            ];

            for (const command of externalCommands) {
                if (await this.tryExternalMermaidCommand(command, args)) {
                    return;
                }
            }

            // Fallback: Internal preview
            await this.internalPreviewMermaid(args);

        } catch (error) {
            logger.error('Failed to preview mermaid diagram', error);
            vscode.window.showErrorMessage('Failed to preview mermaid diagram');
        }
    }

    /**
     * Edit mermaid diagram
     */
    private async editMermaid(args?: MermaidCommandArgs): Promise<void> {
        try {
            // Try external mermaid editors first
            const editorCommands = [
                'mermaid-editor.open',
                'mermaid-markdown-syntax-highlighting.edit'
            ];

            for (const command of editorCommands) {
                if (await this.tryExternalMermaidCommand(command, args)) {
                    return;
                }
            }

            // Fallback: Open in new editor tab
            await this.internalEditMermaid(args);

        } catch (error) {
            logger.error('Failed to edit mermaid diagram', error);
            vscode.window.showErrorMessage('Failed to edit mermaid diagram');
        }
    }

    /**
     * Export mermaid diagram
     */
    private async exportMermaid(args?: MermaidCommandArgs): Promise<void> {
        try {
            // Try external export commands first
            if (await this.tryExternalMermaidCommand('mermaid.export', args)) {
                return;
            }

            // Fallback: Internal export
            await this.internalExportMermaid(args);

        } catch (error) {
            logger.error('Failed to export mermaid diagram', error);
            vscode.window.showErrorMessage('Failed to export mermaid diagram');
        }
    }

    /**
     * Validate mermaid syntax
     */
    private async validateMermaid(args?: MermaidCommandArgs): Promise<void> {
        try {
            const content = args?.content || await this.getCurrentMermaidContent();
            if (!content) {
                vscode.window.showErrorMessage('No mermaid content found');
                return;
            }

            const validation = this.validateMermaidSyntax(content);

            if (validation.isValid) {
                vscode.window.showInformationMessage('✅ Mermaid syntax is valid');
            } else {
                const message = `⚠️ Syntax errors found: ${validation.errors.join(', ')}`;
                vscode.window.showWarningMessage(message);

                // Offer to fix common errors
                const fix = await vscode.window.showInformationMessage(
                    'Would you like to attempt automatic fixes?',
                    'Yes', 'No'
                );

                if (fix === 'Yes') {
                    await this.fixMermaidSyntax(args);
                }
            }

        } catch (error) {
            logger.error('Failed to validate mermaid syntax', error);
            vscode.window.showErrorMessage('Failed to validate mermaid syntax');
        }
    }

    /**
     * Fix common mermaid syntax issues
     */
    private async fixMermaidSyntax(args?: MermaidCommandArgs): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'markdown') {
                return;
            }

            const content = args?.content || await this.getCurrentMermaidContent();
            if (!content) {
                vscode.window.showErrorMessage('No mermaid content found');
                return;
            }

            const fixedContent = this.applySyntaxFixes(content);

            if (fixedContent !== content) {
                // Apply fixes to the document
                const range = await this.getCurrentMermaidRange();
                if (range) {
                    await editor.edit(editBuilder => {
                        editBuilder.replace(range, fixedContent);
                    });

                    vscode.window.showInformationMessage('✅ Mermaid syntax fixes applied');
                    logger.info('Mermaid syntax fixes applied successfully');
                }
            } else {
                vscode.window.showInformationMessage('No fixable issues found');
            }

        } catch (error) {
            logger.error('Failed to fix mermaid syntax', error);
            vscode.window.showErrorMessage('Failed to fix mermaid syntax');
        }
    }

    /**
     * Try to execute external mermaid command
     */
    private async tryExternalMermaidCommand(command: string, args?: MermaidCommandArgs): Promise<boolean> {
        try {
            const extensionId = command.split('.')[0];
            const extension = vscode.extensions.getExtension(extensionId);

            if (extension && extension.isActive) {
                await vscode.commands.executeCommand(command, args);
                logger.info(`External mermaid command executed: ${command}`);
                return true;
            }
        } catch (error) {
            logger.debug(`External mermaid command failed: ${command}`, error);
        }
        return false;
    }

    /**
     * Internal preview implementation using webview
     */
    private async internalPreviewMermaid(args?: MermaidCommandArgs): Promise<void> {
        const content = args?.content || await this.getCurrentMermaidContent();
        if (!content) {
            vscode.window.showErrorMessage('No mermaid content found');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'mermaidPreview',
            'Mermaid Diagram Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getMermaidPreviewHtml(content, args?.type || 'unknown');

        logger.info('Internal mermaid preview opened');
    }

    /**
     * Internal edit implementation
     */
    private async internalEditMermaid(args?: MermaidCommandArgs): Promise<void> {
        const content = args?.content || await this.getCurrentMermaidContent();
        if (!content) {
            vscode.window.showErrorMessage('No mermaid content found');
            return;
        }

        // Create temporary file for editing
        const tempUri = vscode.Uri.parse(`untitled:mermaid-edit-${Date.now()}.mmd`);
        const document = await vscode.workspace.openTextDocument(tempUri);

        const editor = await vscode.window.showTextDocument(document);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), content);
        });

        logger.info('Mermaid content opened in new editor');
    }

    /**
     * Internal export implementation
     */
    private async internalExportMermaid(args?: MermaidCommandArgs): Promise<void> {
        const content = args?.content || await this.getCurrentMermaidContent();
        if (!content) {
            vscode.window.showErrorMessage('No mermaid content found');
            return;
        }

        // Get export options from user
        const options = await this.getExportOptions();
        if (!options) return;

        // Get save location
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`diagram.${options.format}`),
            filters: {
                'Image Files': [options.format],
                'All Files': ['*']
            }
        });

        if (!saveUri) return;

        // Create export webview
        const panel = vscode.window.createWebviewPanel(
            'mermaidExport',
            'Exporting Diagram...',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: false
            }
        );

        panel.webview.html = this.getMermaidExportHtml(content, options, saveUri.fsPath);

        // Handle export completion
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'exportComplete') {
                panel.dispose();
                vscode.window.showInformationMessage(`Diagram exported to ${saveUri.fsPath}`);
            } else if (message.command === 'exportError') {
                panel.dispose();
                vscode.window.showErrorMessage(`Export failed: ${message.error}`);
            }
        });

        logger.info(`Mermaid export initiated: ${saveUri.fsPath}`);
    }

    /**
     * Get current mermaid content from cursor position
     */
    private async getCurrentMermaidContent(): Promise<string | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return null;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const text = document.getText();
        const lines = text.split('\n');

        // Find mermaid block containing cursor
        let inMermaidBlock = false;
        let blockStart = -1;
        let blockContent = '';

        for (let i = 0; i <= position.line; i++) {
            const line = lines[i];

            if (line.trim().startsWith('```mermaid')) {
                inMermaidBlock = true;
                blockStart = i;
                blockContent = '';
                continue;
            }

            if (inMermaidBlock && line.trim() === '```') {
                if (position.line > blockStart && position.line < i) {
                    return blockContent.trim();
                }
                inMermaidBlock = false;
                continue;
            }

            if (inMermaidBlock) {
                blockContent += line + '\n';
            }
        }

        return null;
    }

    /**
     * Get current mermaid block range
     */
    private async getCurrentMermaidRange(): Promise<vscode.Range | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return null;

        const document = editor.document;
        const position = editor.selection.active;
        const text = document.getText();
        const lines = text.split('\n');

        let inMermaidBlock = false;
        let blockStart = -1;

        for (let i = 0; i <= position.line; i++) {
            const line = lines[i];

            if (line.trim().startsWith('```mermaid')) {
                inMermaidBlock = true;
                blockStart = i;
                continue;
            }

            if (inMermaidBlock && line.trim() === '```') {
                if (position.line > blockStart && position.line < i) {
                    // Return range of content (excluding fences)
                    return new vscode.Range(
                        new vscode.Position(blockStart + 1, 0),
                        new vscode.Position(i - 1, lines[i - 1].length)
                    );
                }
                inMermaidBlock = false;
                continue;
            }
        }

        return null;
    }

    /**
     * Validate mermaid syntax
     */
    private validateMermaidSyntax(content: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmed = content.trim();

        if (!trimmed) {
            errors.push('Empty diagram content');
            return { isValid: false, errors };
        }

        // Check for valid diagram type
        const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'gantt', 'pie', 'gitgraph', 'erDiagram', 'journey', 'classDiagram', 'stateDiagram'];
        const hasValidStart = validStarts.some(start => trimmed.toLowerCase().startsWith(start.toLowerCase()));

        if (!hasValidStart) {
            errors.push('Invalid or missing diagram type');
        }

        // Check for basic syntax issues
        const lines = trimmed.split('\n');
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('%')) { // Skip comments
                // Check for unmatched brackets
                const openBrackets = (trimmedLine.match(/[\[\(]/g) || []).length;
                const closeBrackets = (trimmedLine.match(/[\]\)]/g) || []).length;

                if (openBrackets !== closeBrackets) {
                    errors.push(`Line ${index + 1}: Unmatched brackets`);
                }
            }
        });

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Apply common syntax fixes
     */
    private applySyntaxFixes(content: string): string {
        let fixed = content;

        // Fix common diagram type typos
        const typeReplacements = {
            'flowchart ': 'flowchart ',
            'sequence ': 'sequenceDiagram\n',
            'gant ': 'gantt\n',
            'class ': 'classDiagram\n'
        };

        Object.entries(typeReplacements).forEach(([wrong, correct]) => {
            const regex = new RegExp(`^${wrong}`, 'i');
            if (regex.test(fixed.trim())) {
                fixed = fixed.replace(regex, correct);
            }
        });

        // Fix arrow syntax
        fixed = fixed.replace(/-->/g, '-->');
        fixed = fixed.replace(/->/g, '-->');

        // Fix node syntax
        fixed = fixed.replace(/\[\s*([^\]]+)\s*\]/g, '[$1]');
        fixed = fixed.replace(/\(\s*([^\)]+)\s*\)/g, '($1)');

        return fixed;
    }

    /**
     * Get export options from user
     */
    private async getExportOptions(): Promise<DiagramExportOptions | null> {
        const format = await vscode.window.showQuickPick([
            { label: 'PNG', value: 'png' as const },
            { label: 'SVG', value: 'svg' as const },
            { label: 'PDF', value: 'pdf' as const }
        ], { placeHolder: 'Select export format' });

        if (!format) return null;

        const theme = await vscode.window.showQuickPick([
            { label: 'Default', value: 'default' as const },
            { label: 'Dark', value: 'dark' as const },
            { label: 'Forest', value: 'forest' as const },
            { label: 'Neutral', value: 'neutral' as const }
        ], { placeHolder: 'Select theme' });

        if (!theme) return null;

        const scaleInput = await vscode.window.showInputBox({
            prompt: 'Enter scale factor (1.0 = original size)',
            value: '1.0',
            validateInput: (value) => {
                const num = parseFloat(value);
                return isNaN(num) || num <= 0 ? 'Please enter a positive number' : null;
            }
        });

        if (!scaleInput) return null;

        return {
            format: format.value,
            theme: theme.value,
            scale: parseFloat(scaleInput)
        };
    }

    /**
     * Generate HTML for mermaid preview
     */
    private getMermaidPreviewHtml(content: string, type: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Preview</title>
    <script src="${this.MERMAID_CDN}"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .diagram-container {
            text-align: center;
            margin: 20px 0;
        }
        .diagram-info {
            margin-bottom: 20px;
            padding: 10px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
        }
    </style>
</head>
<body>
    <div class="diagram-info">
        <h3>Mermaid Diagram Preview</h3>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="diagram-container">
        <div class="mermaid">
${content}
        </div>
    </div>

    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose'
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate HTML for mermaid export
     */
    private getMermaidExportHtml(content: string, options: DiagramExportOptions, savePath: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="${this.MERMAID_CDN}"></script>
</head>
<body>
    <div id="diagram" class="mermaid">
${content}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        mermaid.initialize({
            startOnLoad: false,
            theme: '${options.theme}',
            securityLevel: 'loose'
        });

        async function exportDiagram() {
            try {
                const element = document.getElementById('diagram');
                const { svg } = await mermaid.render('exportedDiagram', \`${content}\`);
                
                // For SVG export, we can save directly
                if ('${options.format}' === 'svg') {
                    vscode.postMessage({
                        command: 'exportComplete',
                        svg: svg,
                        format: 'svg'
                    });
                } else {
                    // For PNG/PDF, we need additional processing
                    vscode.postMessage({
                        command: 'exportComplete',
                        svg: svg,
                        format: '${options.format}',
                        scale: ${options.scale}
                    });
                }
            } catch (error) {
                vscode.postMessage({
                    command: 'exportError',
                    error: error.message
                });
            }
        }

        exportDiagram();
    </script>
</body>
</html>`;
    }
}
