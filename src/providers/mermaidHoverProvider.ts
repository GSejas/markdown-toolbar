/**
 * @moduleName: Enhanced Hover Provider - Contextual Markdown Actions
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive hover provider for markdown elements including headers, tables, mermaid blocks, and checkboxes
 * @techStack: TypeScript, VS Code API, Context-Aware UI
 * @dependency: vscode.mermaid-markdown-syntax-highlighting (optional), markdown-table-editor (optional)
 * @interModuleDependency: ../engine/ContextDetector, ../engine/MarkdownFormatter, ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PROVIDER_004} (Hover UI Support)
 *   {@link Requirements.REQ_UI_005} (Context-Aware Actions)
 * @briefDescription: Advanced hover provider that detects cursor context and shows relevant actions for headers (H+/H-), tables (add/format), mermaid diagrams (preview/edit), and checkboxes (toggle/info). Uses sophisticated context detection to provide appropriate UI elements
 * @methods: provideHover, detectElementAtPosition, createHeaderHover, createTableHover, createMermaidHover, createCheckboxHover
 * @contributors: VS Code Extension Team, UI/UX Design Team
 * @examples:
 *   - Header hover: Shows "H+ Bigger | H- Smaller | 📑 TOC" with current level info
 *   - Table hover: Shows "➕ Column | ➕ Row | 📐 Format | 🔽 Sort" with table dimensions
 *   - Mermaid hover: Shows "🔍 Preview | ✏️ Edit | 📤 Export | ⚠️ Validate" with diagram type
 * @vulnerabilitiesAssessment: Context detection validation, command URI encoding, external extension integration security
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';

interface ElementContext {
  type: 'header' | 'table' | 'mermaid' | 'checkbox' | 'none';
  element: any;
  range: vscode.Range;
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
  currentColumn?: number;
}

interface MermaidElement {
  content: string;
  range: vscode.Range;
  lineNumber: number;
  diagramType: string;
  hasErrors: boolean;
  errorMessage?: string;
}

interface CheckboxElement {
  content: string;
  range: vscode.Range;
  checked: boolean;
  lineNumber: number;
  indent: string;
  listMarker: string;
}

export class EnhancedHoverProvider implements vscode.HoverProvider {
  private context: vscode.ExtensionContext;
  private contextDetector: ContextDetector;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.contextDetector = new ContextDetector();
    logger.info('[MarkdownToolbar] EnhancedHoverProvider constructed');
  }

  async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
    if (token.isCancellationRequested) {
      return undefined;
    }

    // Only process markdown files
    if (document.languageId !== 'markdown') {
      return undefined;
    }

    // Detect what element we're hovering over
    const elementContext = this.detectElementAtPosition(document, position);

    if (elementContext.type === 'none') {
      return undefined;
    }

    // Create appropriate hover based on element type
    switch (elementContext.type) {
      case 'header':
        return this.createHeaderHover(elementContext.element as HeaderElement, document.uri);
      case 'table':
        return this.createTableHover(elementContext.element as TableElement, document.uri);
      case 'mermaid':
        return this.createMermaidHover(elementContext.element as MermaidElement, document.uri);
      case 'checkbox':
        return this.createCheckboxHover(elementContext.element as CheckboxElement, document.uri);
      default:
        return undefined;
    }
  }

  private detectElementAtPosition(document: vscode.TextDocument, position: vscode.Position): ElementContext {
    const line = document.lineAt(position.line);
    const lineText = line.text;

    // Check for header
    const headerMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const [, hashes, content] = headerMatch;
      return {
        type: 'header',
        element: {
          level: hashes.length,
          content: content.trim(),
          range: line.range,
          lineNumber: position.line
        } as HeaderElement,
        range: line.range
      };
    }

    // Check for table
    if (lineText.includes('|') && lineText.trim().startsWith('|') && lineText.trim().endsWith('|')) {
      const columnCount = (lineText.match(/\|/g) || []).length - 1;
      const currentColumn = this.getCurrentTableColumn(lineText, position.character);

      // Find table boundaries
      const tableRange = this.getTableRange(document, position.line);

      return {
        type: 'table',
        element: {
          headerRow: line.range,
          rows: tableRange.rows,
          lineNumber: position.line,
          columnCount,
          currentColumn
        } as TableElement,
        range: line.range
      };
    }

    // Check for mermaid block
    const mermaidContext = this.getMermaidBlockAtPosition(document, position);
    if (mermaidContext) {
      return {
        type: 'mermaid',
        element: mermaidContext,
        range: mermaidContext.range
      };
    }

    // Check for checkbox
    const checkboxMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s+\[([ xX])\]\s*(.*)$/);
    if (checkboxMatch) {
      const [, indent, marker, checkState, content] = checkboxMatch;
      const checked = checkState.toLowerCase() === 'x';

      // Check if position is within checkbox area
      const checkboxStart = indent.length + marker.length + 1;
      const checkboxEnd = checkboxStart + 3;

      if (position.character >= checkboxStart && position.character <= checkboxEnd) {
        return {
          type: 'checkbox',
          element: {
            content: content.trim(),
            range: line.range,
            checked,
            lineNumber: position.line,
            indent,
            listMarker: marker
          } as CheckboxElement,
          range: line.range
        };
      }
    }

    return { type: 'none', element: null, range: line.range };
  }

  private createHeaderHover(header: HeaderElement, uri: vscode.Uri): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Header info
    const levelName = ['', 'H1 (Title)', 'H2 (Section)', 'H3 (Subsection)', 'H4 (Sub-subsection)', 'H5 (Minor)', 'H6 (Minimal)'][header.level];
    markdown.appendMarkdown(`**📝 ${levelName}**\n\n`);
    markdown.appendMarkdown(`📄 **Content**: ${header.content}\n\n`);

    // Actions
    markdown.appendMarkdown(`**Actions:**\n\n`);

    // H+ (bigger header)
    if (header.level > 1) {
      const increaseArgs = { uri: uri.toString(), line: header.lineNumber, currentLevel: header.level };
      const increaseUri = `command:markdownToolbar.increaseHeaderLevel?${encodeURIComponent(JSON.stringify(increaseArgs))}`;
      markdown.appendMarkdown(`⬆️ [H+ Make Bigger (H${header.level - 1})](${increaseUri})  \n`);
    }

    // H- (smaller header)  
    if (header.level < 6) {
      const decreaseArgs = { uri: uri.toString(), line: header.lineNumber, currentLevel: header.level };
      const decreaseUri = `command:markdownToolbar.decreaseHeaderLevel?${encodeURIComponent(JSON.stringify(decreaseArgs))}`;
      markdown.appendMarkdown(`⬇️ [H- Make Smaller (H${header.level + 1})](${decreaseUri})  \n`);
    }

    // TOC integration
    const tocArgs = { content: header.content, level: header.level };
    const tocUri = `command:markdownToolbar.addToToc?${encodeURIComponent(JSON.stringify(tocArgs))}`;
    markdown.appendMarkdown(`📑 [Add to Table of Contents](${tocUri})  \n`);

    // Navigation
    const navArgs = { uri: uri.toString(), level: header.level };
    const navUri = `command:markdownToolbar.navigateHeaders?${encodeURIComponent(JSON.stringify(navArgs))}`;
    markdown.appendMarkdown(`🧭 [Navigate Headers](${navUri})  \n`);

    // Info
    markdown.appendMarkdown(`\n**Info:**\n`);
    markdown.appendMarkdown(`📍 Line ${header.lineNumber + 1}  \n`);
    markdown.appendMarkdown(`🔢 Level ${header.level}/6  \n`);

    return new vscode.Hover(markdown, header.range);
  }

  private createTableHover(table: TableElement, uri: vscode.Uri): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Table info
    markdown.appendMarkdown(`**📊 Markdown Table**\n\n`);
    markdown.appendMarkdown(`📐 **Dimensions**: ${table.rows.length + 1} rows × ${table.columnCount} columns\n`);
    if (table.currentColumn !== undefined) {
      markdown.appendMarkdown(`👆 **Current Column**: ${table.currentColumn + 1}/${table.columnCount}\n`);
    }
    markdown.appendMarkdown(`\n`);

    // Actions
    markdown.appendMarkdown(`**Actions:**\n\n`);

    // Add column
    const addColArgs = { uri: uri.toString(), line: table.lineNumber };
    const addColUri = `command:markdownToolbar.addTableColumn?${encodeURIComponent(JSON.stringify(addColArgs))}`;
    markdown.appendMarkdown(`➕ [Add Column](${addColUri})  \n`);

    // Add row
    const addRowArgs = { uri: uri.toString(), line: table.lineNumber };
    const addRowUri = `command:markdownToolbar.addTableRow?${encodeURIComponent(JSON.stringify(addRowArgs))}`;
    markdown.appendMarkdown(`➕ [Add Row](${addRowUri})  \n`);

    // Format table
    const formatArgs = { uri: uri.toString(), tableRange: { start: table.lineNumber, end: table.lineNumber + table.rows.length } };
    const formatUri = `command:markdownToolbar.formatTable?${encodeURIComponent(JSON.stringify(formatArgs))}`;
    markdown.appendMarkdown(`📐 [Format Table](${formatUri})  \n`);

    // Sort table
    const sortArgs = { uri: uri.toString(), tableRange: { start: table.lineNumber, end: table.lineNumber + table.rows.length } };
    const sortUri = `command:markdownToolbar.sortTable?${encodeURIComponent(JSON.stringify(sortArgs))}`;
    markdown.appendMarkdown(`🔽 [Sort by Column](${sortUri})  \n`);

    // Table tools (external extension integration)
    markdown.appendMarkdown(`🛠️ [Open Table Editor](command:markdownTableEditor.editTable)  \n`);

    // Info
    markdown.appendMarkdown(`\n**Info:**\n`);
    markdown.appendMarkdown(`📍 Line ${table.lineNumber + 1}  \n`);
    markdown.appendMarkdown(`📊 Table detected  \n`);

    return new vscode.Hover(markdown, table.headerRow);
  }

  private createMermaidHover(mermaid: MermaidElement, uri: vscode.Uri): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Mermaid info
    const typeDisplay = mermaid.diagramType.charAt(0).toUpperCase() + mermaid.diagramType.slice(1);
    markdown.appendMarkdown(`**🎨 Mermaid Diagram (${typeDisplay})**\n\n`);

    if (mermaid.hasErrors) {
      markdown.appendMarkdown(`⚠️ **Status**: Syntax errors detected\n`);
      if (mermaid.errorMessage) {
        markdown.appendMarkdown(`🐛 **Error**: ${mermaid.errorMessage}\n`);
      }
    } else {
      markdown.appendMarkdown(`✅ **Status**: Valid syntax\n`);
    }
    markdown.appendMarkdown(`\n`);

    // Actions
    markdown.appendMarkdown(`**Actions:**\n\n`);

    // Preview
    const previewArgs = { content: mermaid.content, type: mermaid.diagramType };
    const previewUri = `command:markdownToolbar.previewMermaid?${encodeURIComponent(JSON.stringify(previewArgs))}`;
    markdown.appendMarkdown(`🔍 [Preview Diagram](${previewUri})  \n`);

    // Edit
    const editArgs = { uri: uri.toString(), range: { start: mermaid.lineNumber, end: mermaid.lineNumber } };
    const editUri = `command:markdownToolbar.editMermaid?${encodeURIComponent(JSON.stringify(editArgs))}`;
    markdown.appendMarkdown(`✏️ [Edit in Editor](${editUri})  \n`);

    // Export
    const exportArgs = { content: mermaid.content, type: mermaid.diagramType };
    const exportUri = `command:markdownToolbar.exportMermaid?${encodeURIComponent(JSON.stringify(exportArgs))}`;
    markdown.appendMarkdown(`📤 [Export as Image](${exportUri})  \n`);

    // External mermaid extension integration
    markdown.appendMarkdown(`🎨 [Open in Mermaid Editor](command:mermaid.edit)  \n`);

    // Syntax validation
    if (mermaid.hasErrors) {
      const validateArgs = { uri: uri.toString(), range: { start: mermaid.lineNumber, end: mermaid.lineNumber } };
      const validateUri = `command:markdownToolbar.validateMermaid?${encodeURIComponent(JSON.stringify(validateArgs))}`;
      markdown.appendMarkdown(`⚠️ [Fix Syntax Issues](${validateUri})  \n`);
    }

    // Info
    markdown.appendMarkdown(`\n**Info:**\n`);
    markdown.appendMarkdown(`📍 Line ${mermaid.lineNumber + 1}  \n`);
    markdown.appendMarkdown(`🎨 Type: ${typeDisplay}  \n`);
    markdown.appendMarkdown(`📏 Lines: ${mermaid.content.split('\n').length}  \n`);

    return new vscode.Hover(markdown, mermaid.range);
  }

  private createCheckboxHover(checkbox: CheckboxElement, uri: vscode.Uri): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Checkbox info
    const statusIcon = checkbox.checked ? '✅' : '☑️';
    const statusText = checkbox.checked ? 'Checked' : 'Unchecked';

    markdown.appendMarkdown(`**${statusIcon} Task List Item: ${statusText}**\n\n`);

    if (checkbox.content) {
      markdown.appendMarkdown(`📝 **Content**: ${checkbox.content}\n\n`);
    }

    // Actions
    const toggleText = checkbox.checked ? 'Uncheck' : 'Check';
    const toggleIcon = checkbox.checked ? '☐' : '☑️';

    const toggleArgs = { uri: uri.toString(), line: checkbox.lineNumber };
    const toggleUri = `command:markdownToolbar.toggleCheckbox?${encodeURIComponent(JSON.stringify(toggleArgs))}`;

    markdown.appendMarkdown(`**Actions:**\n\n`);
    markdown.appendMarkdown(`${toggleIcon} [${toggleText} Item](${toggleUri})  \n`);

    // Task management integration
    markdown.appendMarkdown(`📋 [Open Task Manager](command:taskboard.openTasks)  \n`);

    // Info
    markdown.appendMarkdown(`\n**Info:**\n`);
    markdown.appendMarkdown(`📍 Line ${checkbox.lineNumber + 1}  \n`);
    markdown.appendMarkdown(`🔤 Marker: \`${checkbox.listMarker}\`  \n`);

    if (checkbox.indent) {
      markdown.appendMarkdown(`↪️ Indented (${checkbox.indent.length} spaces)  \n`);
    }

    return new vscode.Hover(markdown, checkbox.range);
  }

  private getCurrentTableColumn(lineText: string, charPosition: number): number {
    const beforeCursor = lineText.substring(0, charPosition);
    const pipeCount = (beforeCursor.match(/\|/g) || []).length;
    return Math.max(0, pipeCount - 1);
  }

  private getTableRange(document: vscode.TextDocument, startLine: number): { rows: vscode.Range[] } {
    const rows: vscode.Range[] = [];
    const lines = document.lineCount;

    // Scan backwards to find table start
    let tableStart = startLine;
    for (let i = startLine - 1; i >= 0; i--) {
      const line = document.lineAt(i).text;
      if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableStart = i;
      } else {
        break;
      }
    }

    // Scan forwards to find table end
    for (let i = tableStart; i < lines; i++) {
      const line = document.lineAt(i);
      if (line.text.includes('|') && line.text.trim().startsWith('|') && line.text.trim().endsWith('|')) {
        if (i !== startLine) { // Don't include the header row
          rows.push(line.range);
        }
      } else {
        break;
      }
    }

    return { rows };
  }

  private getMermaidBlockAtPosition(document: vscode.TextDocument, position: vscode.Position): MermaidElement | null {
    const text = document.getText();
    const lines = text.split('\n');

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
          // Position is inside this mermaid block
          const range = new vscode.Range(
            new vscode.Position(blockStart, 0),
            new vscode.Position(i, line.length)
          );

          return {
            content: blockContent,
            range,
            lineNumber: blockStart,
            diagramType: this.detectMermaidType(blockContent),
            hasErrors: !this.validateMermaidSyntax(blockContent),
            errorMessage: this.validateMermaidSyntax(blockContent) ? undefined : 'Syntax validation failed'
          };
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
    const trimmed = content.trim();
    if (!trimmed) return false;

    const hasValidStart = /^(graph|flowchart|sequenceDiagram|gantt|pie|gitgraph|erDiagram|journey)/.test(trimmed);
    const hasContent = trimmed.split('\n').length > 1;

    return hasValidStart && hasContent;
  }
}