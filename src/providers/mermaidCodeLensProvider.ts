/**
 * @moduleName: Mermaid CodeLens Provider - Interactive Diagram Controls
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: VS Code CodeLens provider for interactive mermaid diagram blocks in markdown
 * @techStack: TypeScript, VS Code API, Mermaid Extension Integration
 * @dependency: vscode.mermaid-markdown-syntax-highlighting (preferred), minimalist fallback
 * @interModuleDependency: ../engine/ContextDetector, ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PROVIDER_003} (Mermaid Diagram Support)
 *   {@link Requirements.REQ_UI_004} (CodeLens Integration)
 * @briefDescription: Provides interactive CodeLens actions above mermaid diagram blocks including preview, edit, export, and syntax validation. Integrates with external mermaid extensions when available, provides minimalist fallback otherwise
 * @methods: provideCodeLenses, resolveMermaidDiagram, detectMermaidBlocks, validateSyntax
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Above "```mermaid" block: Shows "🔍 Preview | ✏️ Edit | 📤 Export" actions
 *   - Syntax errors: Shows "⚠️ Fix Syntax" with diagnostic info
 * @vulnerabilitiesAssessment: External extension dependency validation, mermaid syntax parsing security
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';

interface MermaidBlock {
  content: string;
  range: vscode.Range;
  lineNumber: number;
  diagramType: string;
  hasErrors: boolean;
  errorMessage?: string;
}

interface CodeBlock {
  content: string;
  language: string;
  range: vscode.Range;
  lineNumber: number;
}

// Header and table interfaces removed - handled by dedicated providers

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
  private context: vscode.ExtensionContext;
  private contextDetector: ContextDetector;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.contextDetector = new ContextDetector();
    logger.info('[MarkdownToolbar] MermaidCodeLensProvider constructed');
  }

  async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
    if (token.isCancellationRequested) {
      logger.info('[MermaidCodeLens] Cancellation requested, returning empty array');
      return [];
    }

    // Only process markdown files
    if (document.languageId !== 'markdown') {
      logger.info(`[MermaidCodeLens] Skipping non-markdown file: ${document.languageId}`);
      return [];
    }

    logger.info(`[MermaidCodeLens] Processing markdown document: ${document.fileName}`);
    const codeLenses: vscode.CodeLens[] = [];

    // Find mermaid blocks
    const mermaidBlocks = this.findMermaidBlocks(document);
    logger.info(`[MermaidCodeLens] Found ${mermaidBlocks.length} mermaid blocks`);
    for (const block of mermaidBlocks) {
      codeLenses.push(...this.createMermaidCodeLenses(block));
    }

    // Find regular code blocks
    const codeBlocks = this.findCodeBlocks(document);
    logger.info(`[MermaidCodeLens] Found ${codeBlocks.length} code blocks`);
    for (const block of codeBlocks) {
      codeLenses.push(...this.createCodeBlockCodeLenses(block));
    }

    // Headers and tables removed - handled by dedicated providers

    logger.info(`[MermaidCodeLens] Total CodeLens items created: ${codeLenses.length}`);
    return codeLenses;
  }

  resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.CodeLens {
    return codeLens;
  }

  private findMermaidBlocks(document: vscode.TextDocument): MermaidBlock[] {
    const blocks: MermaidBlock[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    let inMermaidBlock = false;
    let blockStart = -1;
    let blockContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```mermaid')) {
        inMermaidBlock = true;
        blockStart = i;
        blockContent = '';
        continue;
      }

      if (inMermaidBlock && line.trim() === '```') {
        const range = new vscode.Range(
          new vscode.Position(blockStart, 0),
          new vscode.Position(i, line.length)
        );

        const diagramType = this.detectMermaidType(blockContent);
        const hasErrors = this.validateMermaidSyntax(blockContent);

        blocks.push({
          content: blockContent,
          range,
          lineNumber: blockStart,
          diagramType,
          hasErrors: !hasErrors,
          errorMessage: hasErrors ? undefined : 'Syntax validation failed'
        });

        inMermaidBlock = false;
        continue;
      }

      if (inMermaidBlock) {
        blockContent += line + '\n';
      }
    }

    return blocks;
  }

  private findCodeBlocks(document: vscode.TextDocument): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    let inCodeBlock = false;
    let blockStart = -1;
    let blockContent = '';
    let blockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Starting a code block
          const langMatch = line.trim().match(/^```(\w+)?/);
          blockLanguage = langMatch?.[1] || 'text';

          // Skip mermaid blocks (handled separately)
          if (blockLanguage === 'mermaid') {
            continue;
          }

          inCodeBlock = true;
          blockStart = i;
          blockContent = '';
        } else {
          // Ending a code block
          const range = new vscode.Range(
            new vscode.Position(blockStart, 0),
            new vscode.Position(i, line.length)
          );

          blocks.push({
            content: blockContent,
            language: blockLanguage,
            range,
            lineNumber: blockStart
          });

          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock) {
        blockContent += line + '\n';
      }
    }

    return blocks;
  }

  // Header and table finding methods removed - handled by dedicated providers

  private createMermaidCodeLenses(block: MermaidBlock): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const line = block.lineNumber;

    // Preview command
    const previewCommand = {
      title: '🔍 Preview',
      command: 'markdownToolbar.previewMermaid',
      arguments: [block.content, block.diagramType]
    };

    // Edit command removed as requested

    // Export command
    const exportCommand = {
      title: '📤 Export',
      command: 'markdownToolbar.exportMermaid',
      arguments: [block.content, block.diagramType]
    };

    const range = new vscode.Range(line, 0, line, 0);

    codeLenses.push(new vscode.CodeLens(range, previewCommand));
    codeLenses.push(new vscode.CodeLens(range, exportCommand));

    // Add syntax error warning if needed
    if (block.hasErrors) {
      const errorCommand = {
        title: '⚠️ Fix Syntax',
        command: 'markdownToolbar.fixMermaidSyntax',
        arguments: [block.range, block.errorMessage]
      };
      codeLenses.push(new vscode.CodeLens(range, errorCommand));
    }

    return codeLenses;
  }

  private createCodeBlockCodeLenses(block: CodeBlock): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const line = block.lineNumber;
    const range = new vscode.Range(line, 0, line, 0);

    // Copy code block content
    const copyCommand = {
      title: "$(copy) Copy",
      command: 'mdToolbar.codeblock.copy',
      arguments: [block.content, block.language],
      tooltip: `Copy ${block.language} code block to clipboard`
    };

    codeLenses.push(new vscode.CodeLens(range, copyCommand));

    return codeLenses;
  }

  // Header and table CodeLens creation methods removed - handled by dedicated providers

  private detectMermaidType(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) return 'flowchart';
    if (trimmed.startsWith('sequenceDiagram')) return 'sequence';
    if (trimmed.startsWith('gantt')) return 'gantt';
    if (trimmed.startsWith('pie')) return 'pie';
    if (trimmed.startsWith('gitgraph')) return 'gitgraph';
    if (trimmed.startsWith('erDiagram')) return 'er';
    if (trimmed.startsWith('journey')) return 'journey';
    return 'unknown';
  }

  private validateMermaidSyntax(content: string): boolean {
    // Basic validation - could be enhanced with actual mermaid parser
    const trimmed = content.trim();
    if (!trimmed) return false;

    // Check for basic syntax patterns
    const hasValidStart = /^(graph|flowchart|sequenceDiagram|gantt|pie|gitgraph|erDiagram|journey)/.test(trimmed);
    const hasContent = trimmed.split('\n').length > 1;

    return hasValidStart && hasContent;
  }
}