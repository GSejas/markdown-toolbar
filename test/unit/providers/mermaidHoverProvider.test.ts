import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { EnhancedHoverProvider } from '../../../src/providers/mermaidHoverProvider';

describe('EnhancedHoverProvider', () => {
  let provider: EnhancedHoverProvider;
  let mockDocument: vscode.TextDocument;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      workspaceState: {} as any,
      globalState: {} as any,
      extensionPath: '/test',
      extensionUri: {} as any,
      environmentVariableCollection: {} as any,
      storagePath: '/test',
      globalStoragePath: '/test',
      logPath: '/test',
      extensionMode: 1, // Test mode
      asAbsolutePath: vi.fn(),
    } as any;

    provider = new EnhancedHoverProvider(mockContext);
    mockDocument = new (vscode as any).TextDocument();
  });

  describe('provideHover', () => {
    it('should return undefined for non-markdown files', async () => {
      mockDocument = new (vscode as any).TextDocument('', 'typescript');
      const result = await provider.provideHover(mockDocument, new vscode.Position(0, 0), {} as any);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no element is detected', async () => {
      const markdownText = `Regular text without special elements.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideHover(mockDocument, new vscode.Position(0, 10), {} as any);
      expect(result).toBeUndefined();
    });

    it('should create hover for mermaid diagram', async () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideHover(mockDocument, new vscode.Position(1, 5), {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should create hover for header', async () => {
      const markdownText = `# Main Header`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideHover(mockDocument, new vscode.Position(0, 5), {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should create hover for table', async () => {
      const markdownText = `| Header | Column |\n|--------|--------|\n| Data   | Info   |`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideHover(mockDocument, new vscode.Position(0, 5), {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should create hover for checkbox', async () => {
      const markdownText = `- [x] Completed task`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideHover(mockDocument, new vscode.Position(0, 4), {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });
  });

  describe('detectElementAtPosition', () => {
    it('should detect header element', () => {
      const markdownText = `## Section Header`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).detectElementAtPosition(mockDocument, new vscode.Position(0, 5));

      expect(result.type).toBe('header');
      expect(result.element.level).toBe(2);
      expect(result.element.content).toBe('Section Header');
    });

    it('should detect table element', () => {
      const markdownText = `| Name | Age |\n|------|-----|\n| John | 25  |`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).detectElementAtPosition(mockDocument, new vscode.Position(0, 5));

      expect(result.type).toBe('table');
      expect(result.element.columnCount).toBe(2);
    });

    it('should detect mermaid element', () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).detectElementAtPosition(mockDocument, new vscode.Position(1, 5));

      expect(result.type).toBe('mermaid');
      expect(result.element.diagramType).toBe('flowchart');
      expect(result.element.hasErrors).toBe(false);
    });

    it('should detect checkbox element', () => {
      const markdownText = `- [ ] Unchecked task`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).detectElementAtPosition(mockDocument, new vscode.Position(0, 4));

      expect(result.type).toBe('checkbox');
      expect(result.element.checked).toBe(false);
      expect(result.element.content).toBe('Unchecked task');
    });

    it('should return none for regular text', () => {
      const markdownText = `This is regular text.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).detectElementAtPosition(mockDocument, new vscode.Position(0, 5));

      expect(result.type).toBe('none');
    });
  });

  describe('getMermaidBlockAtPosition', () => {
    it('should find mermaid block at valid position', () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).getMermaidBlockAtPosition(mockDocument, new vscode.Position(1, 5));

      expect(result).toBeDefined();
      expect(result?.content.trim()).toBe('graph TD\nA --> B');
      expect(result?.diagramType).toBe('flowchart');
      expect(result?.hasErrors).toBe(false);
    });

    it('should return null for position outside mermaid block', () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\`\n\nRegular text.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).getMermaidBlockAtPosition(mockDocument, new vscode.Position(5, 5));

      expect(result).toBeNull();
    });

    it('should return null when no mermaid blocks exist', () => {
      const markdownText = `# Regular markdown\n\nSome text.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).getMermaidBlockAtPosition(mockDocument, new vscode.Position(1, 5));

      expect(result).toBeNull();
    });
  });

  describe('detectMermaidType', () => {
    it('should detect flowchart type', () => {
      const result = (provider as any).detectMermaidType('graph TD\nA --> B');
      expect(result).toBe('flowchart');
    });

    it('should detect sequence diagram type', () => {
      const result = (provider as any).detectMermaidType('sequenceDiagram\nAlice->>Bob: Hello');
      expect(result).toBe('sequence');
    });

    it('should detect gantt chart type', () => {
      const result = (provider as any).detectMermaidType('gantt\ndateFormat YYYY-MM-DD');
      expect(result).toBe('gantt');
    });

    it('should detect pie chart type', () => {
      const result = (provider as any).detectMermaidType('pie\ntitle Pie Chart');
      expect(result).toBe('pie');
    });

    it('should return unknown for unrecognized type', () => {
      const result = (provider as any).detectMermaidType('unknownDiagram\nsome content');
      expect(result).toBe('unknown');
    });
  });

  describe('validateMermaidSyntax', () => {
    it('should validate correct flowchart syntax', () => {
      const result = (provider as any).validateMermaidSyntax('graph TD\nA --> B\nB --> C');
      expect(result).toBe(true);
    });

    it('should validate correct sequence diagram syntax', () => {
      const result = (provider as any).validateMermaidSyntax('sequenceDiagram\nAlice->>Bob: Hello');
      expect(result).toBe(true);
    });

    it('should reject empty content', () => {
      const result = (provider as any).validateMermaidSyntax('');
      expect(result).toBe(false);
    });

    it('should reject content without valid start', () => {
      const result = (provider as any).validateMermaidSyntax('invalid content\nmore content');
      expect(result).toBe(false);
    });

    it('should reject single line content', () => {
      const result = (provider as any).validateMermaidSyntax('graph TD');
      expect(result).toBe(false);
    });
  });
});
