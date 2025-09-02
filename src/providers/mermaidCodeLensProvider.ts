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

interface HeaderElement {
  level: number;
  content: string;
  range: vscode.Range;
  lineNumber: number;
}

interface TableElement {
  headerRow: vscode.Range;
  rows: vscode.Range[];
  lineNumber: number;
  columnCount: number;
}

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
      return [];
    }

    // Only process markdown files
    if (document.languageId !== 'markdown') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Find mermaid blocks
    const mermaidBlocks = this.findMermaidBlocks(document);
    for (const block of mermaidBlocks) {
      codeLenses.push(...this.createMermaidCodeLenses(block));
    }

    // Find headers
    const headers = this.findHeaders(document);
    for (const header of headers) {
      codeLenses.push(...this.createHeaderCodeLenses(header));
    }

    // Find tables
    const tables = this.findTables(document);
    for (const table of tables) {
      codeLenses.push(...this.createTableCodeLenses(table));
    }

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

  private findHeaders(document: vscode.TextDocument): HeaderElement[] {
    const headers: HeaderElement[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = headerMatch[2];
        const range = new vscode.Range(
          new vscode.Position(i, 0),
          new vscode.Position(i, line.length)
        );

        headers.push({
          level,
          content,
          range,
          lineNumber: i
        });
      }
    }

    return headers;
  }

  private findTables(document: vscode.TextDocument): TableElement[] {
    const tables: TableElement[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line looks like a table header
      if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
        // Check if next line is a separator
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.match(/^\|[\s\-:]+\|$/)) {
            // This is a table
            const headerRange = new vscode.Range(
              new vscode.Position(i, 0),
              new vscode.Position(i, line.length)
            );

            const rows: vscode.Range[] = [];
            const columnCount = (line.match(/\|/g) || []).length - 1;

            // Find table rows
            for (let j = i + 2; j < lines.length; j++) {
              const rowLine = lines[j];
              if (rowLine.includes('|') && rowLine.trim().startsWith('|') && rowLine.trim().endsWith('|')) {
                rows.push(new vscode.Range(
                  new vscode.Position(j, 0),
                  new vscode.Position(j, rowLine.length)
                ));
              } else {
                break;
              }
            }

            tables.push({
              headerRow: headerRange,
              rows,
              lineNumber: i,
              columnCount
            });
          }
        }
      }
    }

    return tables;
  }

  private createMermaidCodeLenses(block: MermaidBlock): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const line = block.lineNumber;

    // Preview command
    const previewCommand = {
      title: '🔍 Preview',
      command: 'markdownToolbar.previewMermaid',
      arguments: [block.content, block.diagramType]
    };

    // Edit command
    const editCommand = {
      title: '✏️ Edit',
      command: 'markdownToolbar.editMermaid',
      arguments: [block.range]
    };

    // Export command
    const exportCommand = {
      title: '📤 Export',
      command: 'markdownToolbar.exportMermaid',
      arguments: [block.content, block.diagramType]
    };

    const range = new vscode.Range(line, 0, line, 0);

    codeLenses.push(new vscode.CodeLens(range, previewCommand));
    codeLenses.push(new vscode.CodeLens(range, editCommand));
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

  private createHeaderCodeLenses(header: HeaderElement): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const line = header.lineNumber;
    const range = new vscode.Range(line, 0, line, 0);

    // H+ (increase header level)
    if (header.level > 1) {
      const increaseCommand = {
        title: 'H+ Bigger',
        command: 'markdownToolbar.increaseHeaderLevel',
        arguments: [header.range, header.level]
      };
      codeLenses.push(new vscode.CodeLens(range, increaseCommand));
    }

    // H- (decrease header level)
    if (header.level < 6) {
      const decreaseCommand = {
        title: 'H- Smaller',
        command: 'markdownToolbar.decreaseHeaderLevel',
        arguments: [header.range, header.level]
      };
      codeLenses.push(new vscode.CodeLens(range, decreaseCommand));
    }

    // TOC integration
    const tocCommand = {
      title: '📑 Add to TOC',
      command: 'markdownToolbar.addToToc',
      arguments: [header.content, header.level]
    };
    codeLenses.push(new vscode.CodeLens(range, tocCommand));

    return codeLenses;
  }

  private createTableCodeLenses(table: TableElement): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const line = table.lineNumber;
    const range = new vscode.Range(line, 0, line, 0);

    // Add column
    const addColumnCommand = {
      title: '➕ Column',
      command: 'markdownToolbar.addTableColumn',
      arguments: [table.headerRow, table.rows]
    };

    // Add row
    const addRowCommand = {
      title: '➕ Row',
      command: 'markdownToolbar.addTableRow',
      arguments: [table.headerRow, table.rows]
    };

    // Format table
    const formatCommand = {
      title: '📐 Format',
      command: 'markdownToolbar.formatTable',
      arguments: [table.headerRow, table.rows]
    };

    // Sort table
    const sortCommand = {
      title: '🔽 Sort',
      command: 'markdownToolbar.sortTable',
      arguments: [table.headerRow, table.rows]
    };

    codeLenses.push(new vscode.CodeLens(range, addColumnCommand));
    codeLenses.push(new vscode.CodeLens(range, addRowCommand));
    codeLenses.push(new vscode.CodeLens(range, formatCommand));
    codeLenses.push(new vscode.CodeLens(range, sortCommand));

    return codeLenses;
  }

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