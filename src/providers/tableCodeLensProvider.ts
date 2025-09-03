/**
 * @moduleName: Table CodeLens Provider - Interactive Table Controls
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: VS Code CodeLens provider for interactive markdown table manipulation
 * @techStack: TypeScript, VS Code API, Markdown Parsing
 * @dependency: vscode
 * @interModuleDependency: ../engine/ContextDetector, ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PROVIDER_001} (Table Management Support)
 *   {@link Requirements.REQ_UI_002} (CodeLens Integration)
 * @briefDescription: Provides interactive CodeLens actions above markdown tables including add row/column, format table, sort columns, and alignment controls. Handles complex table structures with proper cell alignment and formatting preservation
 * @methods: provideCodeLenses, parseTable, formatTable, addRow, addColumn, sortTable
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Above "| Header |" row: Shows "➕ Row | ➕ Column | 🔄 Format | ⬆️ Sort | ↔️ Align"
 *   - Table operations: Preserves existing content while adding structure
 * @vulnerabilitiesAssessment: Table structure validation, content preservation during operations
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';

interface TableInfo {
  headerRow: string;
  separatorRow: string;
  dataRows: string[];
  startLine: number;
  endLine: number;
  range: vscode.Range;
  columns: number;
  hasAlignment: boolean;
  alignments: ('left' | 'center' | 'right')[];
}

interface TableCell {
  content: string;
  alignment: 'left' | 'center' | 'right';
}

export class TableCodeLensProvider implements vscode.CodeLensProvider {
  private contextDetector = new ContextDetector();

  constructor() {
    logger.info('TableCodeLensProvider initialized');
  }

  async provideCodeLenses(
    document: vscode.TextDocument, 
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (token.isCancellationRequested || document.languageId !== 'markdown') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    try {
      const tables = this.findTables(lines);
      
      for (const table of tables) {
        const range = new vscode.Range(table.startLine, 0, table.startLine, 0);
        
        // Add row command
        codeLenses.push(new vscode.CodeLens(range, {
          title: "➕ Add Row",
          command: 'mdToolbar.table.addRow',
          arguments: [document.uri, table.startLine]
        }));

        // Add column command
        codeLenses.push(new vscode.CodeLens(range, {
          title: "➕ Add Column", 
          command: 'mdToolbar.table.addColumn',
          arguments: [document.uri, table.startLine]
        }));

        // Format table command
        codeLenses.push(new vscode.CodeLens(range, {
          title: "🔄 Format",
          command: 'mdToolbar.table.format',
          arguments: [document.uri, table.startLine]
        }));

        // Sort table command (if has data rows)
        if (table.dataRows.length > 0) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "⬆️ Sort",
            command: 'mdToolbar.table.sort',
            arguments: [document.uri, table.startLine]
          }));
        }

        // Alignment command
        codeLenses.push(new vscode.CodeLens(range, {
          title: "↔️ Align",
          command: 'mdToolbar.table.align',
          arguments: [document.uri, table.startLine]
        }));

        // Remove row command (if has multiple rows)
        if (table.dataRows.length > 0) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "➖ Remove Row",
            command: 'mdToolbar.table.removeRow',
            arguments: [document.uri, table.startLine]
          }));
        }
      }

    } catch (error) {
      logger.error('Error providing table CodeLenses:', error);
    }

    return codeLenses;
  }

  private findTables(lines: string[]): TableInfo[] {
    const tables: TableInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Check if line looks like table header
      if (this.isTableRow(line)) {
        const headerLine = i;
        const separatorLine = i + 1;
        
        // Check for separator row
        if (separatorLine < lines.length && this.isTableSeparator(lines[separatorLine])) {
          const table = this.parseTable(lines, headerLine);
          if (table) {
            tables.push(table);
            i = table.endLine + 1;
            continue;
          }
        }
      }
      i++;
    }

    return tables;
  }

  private isTableRow(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
  }

  private isTableSeparator(line: string): boolean {
    const trimmed = line.trim();
    return /^\|(\s*:?-+:?\s*\|)*\s*:?-+:?\s*\|$/.test(trimmed);
  }

  private parseTable(lines: string[], startLine: number): TableInfo | null {
    try {
      const headerRow = lines[startLine];
      const separatorRow = lines[startLine + 1];
      
      if (!this.isTableSeparator(separatorRow)) {
        return null;
      }

      // Parse alignment from separator row
      const alignments = this.parseAlignments(separatorRow);
      const columns = alignments.length;
      
      // Find data rows
      const dataRows: string[] = [];
      let currentLine = startLine + 2;
      
      while (currentLine < lines.length && this.isTableRow(lines[currentLine])) {
        dataRows.push(lines[currentLine]);
        currentLine++;
      }

      const endLine = currentLine - 1;
      const range = new vscode.Range(startLine, 0, endLine, lines[endLine]?.length || 0);

      return {
        headerRow,
        separatorRow,
        dataRows,
        startLine,
        endLine,
        range,
        columns,
        hasAlignment: alignments.some(a => a !== 'left'),
        alignments
      };

    } catch (error) {
      logger.warn('Failed to parse table:', error);
      return null;
    }
  }

  private parseAlignments(separatorRow: string): ('left' | 'center' | 'right')[] {
    const alignments: ('left' | 'center' | 'right')[] = [];
    const cells = separatorRow.split('|').filter(cell => cell.trim());
    
    for (const cell of cells) {
      const trimmed = cell.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
        alignments.push('center');
      } else if (trimmed.endsWith(':')) {
        alignments.push('right');
      } else {
        alignments.push('left');
      }
    }
    
    return alignments;
  }

  private parseTableCells(row: string): string[] {
    return row.split('|')
      .slice(1, -1) // Remove empty first/last elements from split
      .map(cell => cell.trim());
  }

  private formatTableRow(cells: string[], alignments: ('left' | 'center' | 'right')[], columnWidths: number[]): string {
    const formattedCells = cells.map((cell, i) => {
      const width = columnWidths[i] || cell.length;
      const alignment = alignments[i] || 'left';
      
      switch (alignment) {
        case 'center':
          return this.centerAlign(cell, width);
        case 'right':
          return this.rightAlign(cell, width);
        default:
          return this.leftAlign(cell, width);
      }
    });
    
    return `| ${formattedCells.join(' | ')} |`;
  }

  private leftAlign(text: string, width: number): string {
    return text.padEnd(width);
  }

  private rightAlign(text: string, width: number): string {
    return text.padStart(width);
  }

  private centerAlign(text: string, width: number): string {
    const padding = width - text.length;
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
  }

  private createSeparatorRow(alignments: ('left' | 'center' | 'right')[], columnWidths: number[]): string {
    const separators = alignments.map((alignment, i) => {
      const width = Math.max(columnWidths[i] || 3, 3); // Minimum width of 3
      const dashes = '-'.repeat(width);
      
      switch (alignment) {
        case 'center':
          return `:${dashes.slice(2)}:`;
        case 'right':
          return `${dashes.slice(1)}:`;
        default:
          return dashes;
      }
    });
    
    return `| ${separators.join(' | ')} |`;
  }

  private calculateColumnWidths(rows: string[][], alignments: ('left' | 'center' | 'right')[]): number[] {
    const widths: number[] = [];
    
    for (let col = 0; col < alignments.length; col++) {
      let maxWidth = 3; // Minimum width
      
      for (const row of rows) {
        if (row[col]) {
          maxWidth = Math.max(maxWidth, row[col].length);
        }
      }
      
      widths[col] = maxWidth;
    }
    
    return widths;
  }

  /**
   * Public methods for table operations (called by commands)
   */
  public async addRowToTable(document: vscode.TextDocument, tableStartLine: number): Promise<void> {
    const lines = document.getText().split('\n');
    const table = this.parseTable(lines, tableStartLine);
    
    if (!table) {
      logger.warn('No table found at line', tableStartLine);
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

    // Create empty row with same number of columns
    const emptyCells = Array(table.columns).fill('');
    const columnWidths = this.calculateColumnWidths(
      [this.parseTableCells(table.headerRow), ...table.dataRows.map(row => this.parseTableCells(row))],
      table.alignments
    );
    
    const newRow = this.formatTableRow(emptyCells, table.alignments, columnWidths);
    const insertPosition = new vscode.Position(table.endLine + 1, 0);
    
    await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, newRow + '\n');
    });
  }

  public async addColumnToTable(document: vscode.TextDocument, tableStartLine: number): Promise<void> {
    const lines = document.getText().split('\n');
    const table = this.parseTable(lines, tableStartLine);
    
    if (!table) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

    await editor.edit(editBuilder => {
      // Add to header
      const headerCells = this.parseTableCells(table.headerRow);
      headerCells.push('New Column');
      const newAlignments = [...table.alignments, 'left' as const];
      const newColumnWidths = this.calculateColumnWidths([headerCells], newAlignments);
      
      editBuilder.replace(
        new vscode.Range(table.startLine, 0, table.startLine, lines[table.startLine].length),
        this.formatTableRow(headerCells, newAlignments, newColumnWidths)
      );

      // Update separator
      editBuilder.replace(
        new vscode.Range(table.startLine + 1, 0, table.startLine + 1, lines[table.startLine + 1].length),
        this.createSeparatorRow(newAlignments, newColumnWidths)
      );

      // Add to data rows
      table.dataRows.forEach((row, index) => {
        const dataCells = this.parseTableCells(row);
        dataCells.push('');
        const lineNumber = table.startLine + 2 + index;
        
        editBuilder.replace(
          new vscode.Range(lineNumber, 0, lineNumber, lines[lineNumber].length),
          this.formatTableRow(dataCells, newAlignments, newColumnWidths)
        );
      });
    });
  }

  public async formatTable(document: vscode.TextDocument, tableStartLine: number): Promise<void> {
    const lines = document.getText().split('\n');
    const table = this.parseTable(lines, tableStartLine);
    
    if (!table) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

    // Parse all rows
    const headerCells = this.parseTableCells(table.headerRow);
    const dataRowsCells = table.dataRows.map(row => this.parseTableCells(row));
    const allRowsCells = [headerCells, ...dataRowsCells];
    
    // Calculate optimal column widths
    const columnWidths = this.calculateColumnWidths(allRowsCells, table.alignments);
    
    await editor.edit(editBuilder => {
      // Format header
      editBuilder.replace(
        new vscode.Range(table.startLine, 0, table.startLine, lines[table.startLine].length),
        this.formatTableRow(headerCells, table.alignments, columnWidths)
      );

      // Format separator
      editBuilder.replace(
        new vscode.Range(table.startLine + 1, 0, table.startLine + 1, lines[table.startLine + 1].length),
        this.createSeparatorRow(table.alignments, columnWidths)
      );

      // Format data rows
      dataRowsCells.forEach((cells, index) => {
        const lineNumber = table.startLine + 2 + index;
        editBuilder.replace(
          new vscode.Range(lineNumber, 0, lineNumber, lines[lineNumber].length),
          this.formatTableRow(cells, table.alignments, columnWidths)
        );
      });
    });
  }
}