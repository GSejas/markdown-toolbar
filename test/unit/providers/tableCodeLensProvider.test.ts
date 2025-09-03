import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { TableCodeLensProvider } from '../../../src/providers/tableCodeLensProvider';

describe('TableCodeLensProvider', () => {
  let provider: TableCodeLensProvider;
  let mockDocument: vscode.TextDocument;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    provider = new TableCodeLensProvider();
    mockDocument = new (vscode as any).TextDocument();
  });

  describe('provideCodeLenses', () => {
    it('should return empty array for non-markdown files', async () => {
      mockDocument = new (vscode as any).TextDocument('', 'typescript');
      const result = await provider.provideCodeLenses(mockDocument, {} as any);
      expect(result).toEqual([]);
    });

    it('should return empty array when no tables found', async () => {
      const markdownText = `# Regular markdown\n\nSome text content.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);
      expect(result).toEqual([]);
    });

    it('should create CodeLens for simple table', async () => {
      const markdownText = `| Header1 | Header2 |\n|---------|---------|\n| Data1   | Data2   |`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(6); // Add Row, Add Column, Format, Sort, Align, Remove Row
      expect(result[0].command?.title).toBe('➕ Add Row');
      expect(result[1].command?.title).toBe('➕ Add Column');
      expect(result[2].command?.title).toBe('🔄 Format');
      expect(result[3].command?.title).toBe('⬆️ Sort');
      expect(result[4].command?.title).toBe('↔️ Align');
      expect(result[5].command?.title).toBe('➖ Remove Row');
    });

    it('should create CodeLens for table without data rows', async () => {
      const markdownText = `| Header1 | Header2 |\n|---------|---------|`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(4); // Add Row, Add Column, Format, Align (no Sort/Remove)
      expect(result[0].command?.title).toBe('➕ Add Row');
      expect(result[1].command?.title).toBe('➕ Add Column');
      expect(result[2].command?.title).toBe('🔄 Format');
      expect(result[3].command?.title).toBe('↔️ Align');
    });

    it('should handle multiple tables', async () => {
      const markdownText = `| Table1 |\n|--------|\n| Data   |\n\n| Table2 |\n|--------|\n| Data   |`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(12); // 6 CodeLens per table × 2 tables
    });

    it('should handle table with alignment', async () => {
      const markdownText = `| Left | Center | Right |\n|:-----|:------:|------:|\n| A    | B      | C     |`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(6); // Add Row, Add Column, Format, Sort, Align, Remove Row
      expect(result[4].command?.title).toBe('↔️ Align');
    });
  });

  describe('findTables', () => {
    it('should find single table', () => {
      const lines = [
        '| Header1 | Header2 |',
        '|---------|---------|',
        '| Data1   | Data2   |'
      ];
      const result = (provider as any).findTables(lines);

      expect(result).toHaveLength(1);
      expect(result[0].columns).toBe(2);
      expect(result[0].dataRows).toHaveLength(1);
      expect(result[0].startLine).toBe(0);
      expect(result[0].endLine).toBe(2);
    });

    it('should find multiple tables', () => {
      const lines = [
        '| Table1 |',
        '|--------|',
        '| Data   |',
        '',
        '| Table2 |',
        '|--------|',
        '| Data   |'
      ];
      const result = (provider as any).findTables(lines);

      expect(result).toHaveLength(2);
      expect(result[0].startLine).toBe(0);
      expect(result[1].startLine).toBe(4);
    });

    it('should return empty array when no tables', () => {
      const lines = [
        '# Header',
        'Regular text',
        'More text'
      ];
      const result = (provider as any).findTables(lines);

      expect(result).toEqual([]);
    });

    it('should skip invalid table structures', () => {
      const lines = [
        '| Header |',
        'Invalid separator',
        '| Data |'
      ];
      const result = (provider as any).findTables(lines);

      expect(result).toEqual([]);
    });
  });

  describe('isTableRow', () => {
    it('should identify valid table rows', () => {
      expect((provider as any).isTableRow('| Header |')).toBe(true);
      expect((provider as any).isTableRow('| Data |')).toBe(true);
      expect((provider as any).isTableRow('| A | B | C |')).toBe(true);
    });

    it('should reject invalid table rows', () => {
      expect((provider as any).isTableRow('Header')).toBe(false);
      expect((provider as any).isTableRow('|Header')).toBe(false);
      expect((provider as any).isTableRow('Header|')).toBe(false);
      expect((provider as any).isTableRow('Regular text')).toBe(false);
    });
  });

  describe('isTableSeparator', () => {
    it('should identify valid table separators', () => {
      expect((provider as any).isTableSeparator('|---------|---------|')).toBe(true);
      expect((provider as any).isTableSeparator('| :------: |')).toBe(true);
      expect((provider as any).isTableSeparator('|:---:|:---:|')).toBe(true);
      expect((provider as any).isTableSeparator('| --- | --- |')).toBe(true);
    });

    it('should reject invalid table separators', () => {
      expect((provider as any).isTableSeparator('Header')).toBe(false);
      expect((provider as any).isTableSeparator('| Header |')).toBe(false);
      expect((provider as any).isTableSeparator('---------')).toBe(false);
    });
  });

  describe('parseAlignments', () => {
    it('should parse left alignment', () => {
      const result = (provider as any).parseAlignments('| --- | --- |');
      expect(result).toEqual(['left', 'left']);
    });

    it('should parse center alignment', () => {
      const result = (provider as any).parseAlignments('| :---: | :---: |');
      expect(result).toEqual(['center', 'center']);
    });

    it('should parse right alignment', () => {
      const result = (provider as any).parseAlignments('| ---: | ---: |');
      expect(result).toEqual(['right', 'right']);
    });

    it('should parse mixed alignments', () => {
      const result = (provider as any).parseAlignments('| :---: | ---: | --- |');
      expect(result).toEqual(['center', 'right', 'left']);
    });
  });

  describe('parseTable', () => {
    it('should parse simple table', () => {
      const lines = [
        '| Header1 | Header2 |',
        '|---------|---------|',
        '| Data1   | Data2   |',
        '| Data3   | Data4   |'
      ];
      const result = (provider as any).parseTable(lines, 0);

      expect(result).toBeDefined();
      expect(result?.columns).toBe(2);
      expect(result?.dataRows).toHaveLength(2);
      expect(result?.startLine).toBe(0);
      expect(result?.endLine).toBe(3);
      expect(result?.hasAlignment).toBe(false);
    });

    it('should parse table with alignment', () => {
      const lines = [
        '| Left | Center | Right |',
        '| :---- | :----: | ----: |',
        '| A    | B      | C     |'
      ];
      const result = (provider as any).parseTable(lines, 0);

      expect(result).toBeDefined();
      expect(result?.columns).toBe(3);
      expect(result?.hasAlignment).toBe(true);
      expect(result?.alignments).toEqual(['left', 'center', 'right']);
    });

    it('should return null for invalid table', () => {
      const lines = [
        '| Header |',
        'Invalid separator',
        '| Data |'
      ];
      const result = (provider as any).parseTable(lines, 0);

      expect(result).toBeNull();
    });
  });
});
