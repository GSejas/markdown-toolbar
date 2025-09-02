/**
 * @moduleName: Table Commands - Markdown Table Management
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive markdown table manipulation commands with external extension integration
 * @techStack: TypeScript, VS Code API, Table Formatting Algorithms
 * @dependency: vscode, markdown-table-editor (preferred), table-formatter (fallback)
 * @interModuleDependency: ../engine/ContextDetector, ../engine/MarkdownFormatter
 * @requirementsTraceability:
 *   {@link Requirements.REQ_TABLE_001} (Table Structure Manipulation)
 *   {@link Requirements.REQ_TABLE_002} (Table Formatting)
 *   {@link Requirements.REQ_TABLE_003} (External Integration)
 * @briefDescription: Advanced table management commands supporting add/remove columns/rows, table formatting, sorting, and alignment. Prioritizes external table editor extensions with sophisticated internal fallbacks
 * @methods: addTableColumn, addTableRow, removeTableColumn, removeTableRow, formatTable, sortTable
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Add column: Inserts new column with proper alignment
 *   - Format table: Aligns all columns and normalizes spacing
 *   - Sort table: Orders rows by selected column with data type detection
 * @vulnerabilitiesAssessment: Table structure validation, data type inference, external extension security
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { MarkdownFormatter } from '../engine/MarkdownFormatter';
import { logger } from '../services/Logger';

interface TableCommandArgs {
    uri?: string;
    line?: number;
    tableRange?: { start: number; end: number };
}

interface TableStructure {
    headerRow: string[];
    separatorRow: string[];
    dataRows: string[][];
    startLine: number;
    endLine: number;
    columnCount: number;
}

export class TableCommands {
    private contextDetector: ContextDetector;
    private formatter: MarkdownFormatter;

    constructor(contextDetector: ContextDetector, formatter: MarkdownFormatter) {
        this.contextDetector = contextDetector;
        this.formatter = formatter;
    }

    /**
     * Register all table-related commands
     */
    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Add column
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.addTableColumn',
            (args?: TableCommandArgs) => this.addTableColumn(args)
        ));

        // Add row
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.addTableRow',
            (args?: TableCommandArgs) => this.addTableRow(args)
        ));

        // Remove column
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.removeTableColumn',
            (args?: TableCommandArgs) => this.removeTableColumn(args)
        ));

        // Remove row
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.removeTableRow',
            (args?: TableCommandArgs) => this.removeTableRow(args)
        ));

        // Format table
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.formatTable',
            (args?: TableCommandArgs) => this.formatTable(args)
        ));

        // Sort table
        disposables.push(vscode.commands.registerCommand(
            'markdownToolbar.sortTable',
            (args?: TableCommandArgs) => this.sortTable(args)
        ));

        return disposables;
    }

    /**
     * Add column to table
     */
    private async addTableColumn(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external table editor first
            if (await this.tryExternalTableCommand('markdownTableEditor.addColumn')) {
                return;
            }

            // Fallback: Internal implementation
            await this.internalAddColumn(args);

        } catch (error) {
            logger.error('Failed to add table column', error);
            vscode.window.showErrorMessage('Failed to add table column');
        }
    }

    /**
     * Add row to table
     */
    private async addTableRow(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external table editor first
            if (await this.tryExternalTableCommand('markdownTableEditor.addRow')) {
                return;
            }

            // Fallback: Internal implementation
            await this.internalAddRow(args);

        } catch (error) {
            logger.error('Failed to add table row', error);
            vscode.window.showErrorMessage('Failed to add table row');
        }
    }

    /**
     * Remove column from table
     */
    private async removeTableColumn(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external table editor first
            if (await this.tryExternalTableCommand('markdownTableEditor.removeColumn')) {
                return;
            }

            // Fallback: Internal implementation
            await this.internalRemoveColumn(args);

        } catch (error) {
            logger.error('Failed to remove table column', error);
            vscode.window.showErrorMessage('Failed to remove table column');
        }
    }

    /**
     * Remove row from table
     */
    private async removeTableRow(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external table editor first
            if (await this.tryExternalTableCommand('markdownTableEditor.removeRow')) {
                return;
            }

            // Fallback: Internal implementation
            await this.internalRemoveRow(args);

        } catch (error) {
            logger.error('Failed to remove table row', error);
            vscode.window.showErrorMessage('Failed to remove table row');
        }
    }

    /**
     * Format table alignment and spacing
     */
    private async formatTable(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external formatters first
            const formatCommands = [
                'markdownTableEditor.formatTable',
                'tableFormatter.formatTable',
                'markdown.extension.formatTable'
            ];

            for (const command of formatCommands) {
                if (await this.tryExternalTableCommand(command)) {
                    return;
                }
            }

            // Fallback: Internal implementation
            await this.internalFormatTable(args);

        } catch (error) {
            logger.error('Failed to format table', error);
            vscode.window.showErrorMessage('Failed to format table');
        }
    }

    /**
     * Sort table by column
     */
    private async sortTable(args?: TableCommandArgs): Promise<void> {
        try {
            // Try external table sorters first
            if (await this.tryExternalTableCommand('markdownTableEditor.sortTable')) {
                return;
            }

            // Fallback: Internal implementation
            await this.internalSortTable(args);

        } catch (error) {
            logger.error('Failed to sort table', error);
            vscode.window.showErrorMessage('Failed to sort table');
        }
    }

    /**
     * Try to execute external table command
     */
    private async tryExternalTableCommand(command: string): Promise<boolean> {
        try {
            const extensionId = command.split('.')[0];
            const extension = vscode.extensions.getExtension(extensionId);

            if (extension && extension.isActive) {
                await vscode.commands.executeCommand(command);
                logger.info(`External table command executed: ${command}`);
                return true;
            }
        } catch (error) {
            logger.debug(`External table command failed: ${command}`, error);
        }
        return false;
    }

    /**
     * Parse table structure at cursor position
     */
    private parseTableAtCursor(): TableStructure | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return null;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const currentLineText = document.lineAt(position.line).text;

        // Check if current line is part of a table
        if (!this.isTableLine(currentLineText)) {
            return null;
        }

        // Find table boundaries
        let startLine = position.line;
        let endLine = position.line;

        // Scan backwards for table start
        for (let i = position.line - 1; i >= 0; i--) {
            const line = document.lineAt(i).text;
            if (this.isTableLine(line)) {
                startLine = i;
            } else {
                break;
            }
        }

        // Scan forwards for table end
        for (let i = position.line + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (this.isTableLine(line)) {
                endLine = i;
            } else {
                break;
            }
        }

        // Parse table structure
        const headerRow = this.parseTableRow(document.lineAt(startLine).text);
        const separatorLine = startLine + 1;
        const separatorRow = separatorLine <= endLine ?
            this.parseTableRow(document.lineAt(separatorLine).text) : [];

        const dataRows: string[][] = [];
        for (let i = separatorLine + 1; i <= endLine; i++) {
            const row = this.parseTableRow(document.lineAt(i).text);
            if (row.length > 0) {
                dataRows.push(row);
            }
        }

        return {
            headerRow,
            separatorRow,
            dataRows,
            startLine,
            endLine,
            columnCount: headerRow.length
        };
    }

    /**
     * Check if line is part of a markdown table
     */
    private isTableLine(line: string): boolean {
        const trimmed = line.trim();
        return trimmed.includes('|') && trimmed.startsWith('|') && trimmed.endsWith('|');
    }

    /**
     * Parse table row into array of cell values
     */
    private parseTableRow(line: string): string[] {
        const trimmed = line.trim();
        if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
            return [];
        }

        // Remove leading and trailing pipes, split by pipes
        const content = trimmed.slice(1, -1);
        return content.split('|').map(cell => cell.trim());
    }

    /**
     * Format table row with proper spacing
     */
    private formatTableRow(cells: string[], columnWidths: number[]): string {
        const formattedCells = cells.map((cell, index) => {
            const width = columnWidths[index] || 10;
            return cell.padEnd(width);
        });
        return `| ${formattedCells.join(' | ')} |`;
    }

    /**
     * Internal implementation: Add column
     */
    private async internalAddColumn(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        const editor = vscode.window.activeTextEditor!;

        // Get new column name from user
        const columnName = await vscode.window.showInputBox({
            prompt: 'Enter column name',
            value: `Column ${table.columnCount + 1}`
        });

        if (!columnName) return;

        await editor.edit(editBuilder => {
            // Add to header row
            const newHeaderRow = [...table.headerRow, columnName];
            const headerLine = editor.document.lineAt(table.startLine);
            editBuilder.replace(headerLine.range, this.formatTableRow(newHeaderRow, []));

            // Add to separator row
            if (table.separatorRow.length > 0) {
                const newSeparatorRow = [...table.separatorRow, '---'];
                const separatorLine = editor.document.lineAt(table.startLine + 1);
                editBuilder.replace(separatorLine.range, this.formatTableRow(newSeparatorRow, []));
            }

            // Add to data rows
            table.dataRows.forEach((row, index) => {
                const newRow = [...row, ''];
                const lineIndex = table.startLine + 2 + index;
                if (lineIndex <= table.endLine) {
                    const dataLine = editor.document.lineAt(lineIndex);
                    editBuilder.replace(dataLine.range, this.formatTableRow(newRow, []));
                }
            });
        });

        logger.info(`Table column added: ${columnName}`);
        vscode.window.showInformationMessage(`Column "${columnName}" added to table`);
    }

    /**
     * Internal implementation: Add row
     */
    private async internalAddRow(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        const editor = vscode.window.activeTextEditor!;

        // Create new empty row
        const newRow = new Array(table.columnCount).fill('');
        const newRowText = this.formatTableRow(newRow, []);

        await editor.edit(editBuilder => {
            const insertPosition = new vscode.Position(table.endLine + 1, 0);
            editBuilder.insert(insertPosition, newRowText + '\n');
        });

        logger.info('Table row added');
        vscode.window.showInformationMessage('Row added to table');
    }

    /**
     * Internal implementation: Remove column
     */
    private async internalRemoveColumn(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        if (table.columnCount <= 1) {
            vscode.window.showErrorMessage('Cannot remove the last column');
            return;
        }

        const editor = vscode.window.activeTextEditor!;
        const position = editor.selection.active;
        const currentLine = editor.document.lineAt(position.line).text;
        const currentColumn = this.getCurrentColumn(currentLine, position.character);

        await editor.edit(editBuilder => {
            // Remove from header row
            const newHeaderRow = table.headerRow.filter((_, index) => index !== currentColumn);
            const headerLine = editor.document.lineAt(table.startLine);
            editBuilder.replace(headerLine.range, this.formatTableRow(newHeaderRow, []));

            // Remove from separator row
            if (table.separatorRow.length > 0) {
                const newSeparatorRow = table.separatorRow.filter((_, index) => index !== currentColumn);
                const separatorLine = editor.document.lineAt(table.startLine + 1);
                editBuilder.replace(separatorLine.range, this.formatTableRow(newSeparatorRow, []));
            }

            // Remove from data rows
            table.dataRows.forEach((row, index) => {
                const newRow = row.filter((_, colIndex) => colIndex !== currentColumn);
                const lineIndex = table.startLine + 2 + index;
                if (lineIndex <= table.endLine) {
                    const dataLine = editor.document.lineAt(lineIndex);
                    editBuilder.replace(dataLine.range, this.formatTableRow(newRow, []));
                }
            });
        });

        logger.info(`Table column removed at index ${currentColumn}`);
        vscode.window.showInformationMessage('Column removed from table');
    }

    /**
     * Internal implementation: Remove row
     */
    private async internalRemoveRow(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        const editor = vscode.window.activeTextEditor!;
        const position = editor.selection.active;

        // Don't allow removing header or separator rows
        if (position.line <= table.startLine + 1) {
            vscode.window.showErrorMessage('Cannot remove header or separator row');
            return;
        }

        await editor.edit(editBuilder => {
            const lineToRemove = editor.document.lineAt(position.line);
            const fullRange = new vscode.Range(
                position.line,
                0,
                position.line + 1,
                0
            );
            editBuilder.delete(fullRange);
        });

        logger.info(`Table row removed at line ${position.line}`);
        vscode.window.showInformationMessage('Row removed from table');
    }

    /**
     * Internal implementation: Format table
     */
    private async internalFormatTable(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        const editor = vscode.window.activeTextEditor!;

        // Calculate optimal column widths
        const columnWidths = new Array(table.columnCount).fill(0);

        // Check header row
        table.headerRow.forEach((cell, index) => {
            columnWidths[index] = Math.max(columnWidths[index], cell.length);
        });

        // Check data rows
        table.dataRows.forEach(row => {
            row.forEach((cell, index) => {
                if (index < columnWidths.length) {
                    columnWidths[index] = Math.max(columnWidths[index], cell.length);
                }
            });
        });

        // Ensure minimum width
        columnWidths.forEach((width, index) => {
            columnWidths[index] = Math.max(width, 3);
        });

        await editor.edit(editBuilder => {
            // Format header row
            const headerLine = editor.document.lineAt(table.startLine);
            editBuilder.replace(headerLine.range, this.formatTableRow(table.headerRow, columnWidths));

            // Format separator row
            if (table.separatorRow.length > 0) {
                const separatorRow = columnWidths.map(width => '-'.repeat(width));
                const separatorLine = editor.document.lineAt(table.startLine + 1);
                editBuilder.replace(separatorLine.range, this.formatTableRow(separatorRow, columnWidths));
            }

            // Format data rows
            table.dataRows.forEach((row, index) => {
                const lineIndex = table.startLine + 2 + index;
                if (lineIndex <= table.endLine) {
                    const dataLine = editor.document.lineAt(lineIndex);
                    editBuilder.replace(dataLine.range, this.formatTableRow(row, columnWidths));
                }
            });
        });

        logger.info('Table formatted successfully');
        vscode.window.showInformationMessage('Table formatted');
    }

    /**
     * Internal implementation: Sort table
     */
    private async internalSortTable(args?: TableCommandArgs): Promise<void> {
        const table = this.parseTableAtCursor();
        if (!table) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }

        // Show column picker
        const columnChoices = table.headerRow.map((header, index) => ({
            label: header,
            description: `Column ${index + 1}`,
            index
        }));

        const selectedColumn = await vscode.window.showQuickPick(columnChoices, {
            placeHolder: 'Select column to sort by'
        });

        if (!selectedColumn) return;

        const sortOrder = await vscode.window.showQuickPick([
            { label: 'Ascending', value: 'asc' },
            { label: 'Descending', value: 'desc' }
        ], {
            placeHolder: 'Select sort order'
        });

        if (!sortOrder) return;

        // Sort data rows
        const sortedRows = [...table.dataRows].sort((a, b) => {
            const aValue = a[selectedColumn.index] || '';
            const bValue = b[selectedColumn.index] || '';

            // Try numeric comparison first
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);

            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
                comparison = aNum - bNum;
            } else {
                comparison = aValue.localeCompare(bValue);
            }

            return sortOrder.value === 'desc' ? -comparison : comparison;
        });

        const editor = vscode.window.activeTextEditor!;

        await editor.edit(editBuilder => {
            // Replace data rows with sorted versions
            sortedRows.forEach((row, index) => {
                const lineIndex = table.startLine + 2 + index;
                if (lineIndex <= table.endLine) {
                    const dataLine = editor.document.lineAt(lineIndex);
                    editBuilder.replace(dataLine.range, this.formatTableRow(row, []));
                }
            });
        });

        logger.info(`Table sorted by column ${selectedColumn.index} (${sortOrder.value})`);
        vscode.window.showInformationMessage(`Table sorted by "${selectedColumn.label}" (${sortOrder.label})`);
    }

    /**
     * Get current column index based on cursor position
     */
    private getCurrentColumn(lineText: string, charPosition: number): number {
        const beforeCursor = lineText.substring(0, charPosition);
        const pipeCount = (beforeCursor.match(/\|/g) || []).length;
        return Math.max(0, pipeCount - 1);
    }
}
