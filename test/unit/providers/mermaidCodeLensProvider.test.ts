import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { MermaidCodeLensProvider } from '../../../src/providers/mermaidCodeLensProvider';

describe('MermaidCodeLensProvider', () => {
  let provider: MermaidCodeLensProvider;
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

    provider = new MermaidCodeLensProvider(mockContext);
    mockDocument = new (vscode as any).TextDocument();
  });

  describe('provideCodeLenses', () => {
    it('should return empty array for non-markdown files', async () => {
      mockDocument = new (vscode as any).TextDocument('', 'typescript');
      const result = await provider.provideCodeLenses(mockDocument, {} as any);
      expect(result).toEqual([]);
    });

    it('should return empty array when no mermaid blocks found', async () => {
      const markdownText = `# Regular markdown\n\nSome text content.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);
      expect(result).toEqual([]);
    });

    it('should create CodeLens for mermaid flowchart block', async () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(2); // Preview and Export
      expect(result[0].command?.title).toBe('🔍 Preview');
      expect(result[1].command?.title).toBe('📤 Export');
    });

    it('should create CodeLens for mermaid sequence diagram', async () => {
      const markdownText = `\`\`\`mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(2);
      expect(result[0].command?.title).toBe('🔍 Preview');
      expect(result[1].command?.title).toBe('📤 Export');
    });

    it('should handle multiple mermaid blocks', async () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\`\n\n\`\`\`mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(5); // 2 mermaid blocks × 2 CodeLens each + 1 code block
    });

    it('should create CodeLens for regular code blocks', async () => {
      const markdownText = `\`\`\`javascript\nconsole.log('hello');\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(1);
      expect(result[0].command?.title).toBe('$(copy) Copy');
    });
  });

  describe('resolveCodeLens', () => {
    it('should return the CodeLens unchanged', () => {
      const codeLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 0));
      const result = provider.resolveCodeLens(codeLens, {} as any);
      expect(result).toBe(codeLens);
    });
  });

  describe('findMermaidBlocks', () => {
    it('should find single mermaid block', () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).findMermaidBlocks(mockDocument);

      expect(result).toHaveLength(1);
      expect(result[0].content.trim()).toBe('graph TD\nA --> B');
      expect(result[0].diagramType).toBe('flowchart');
      expect(result[0].hasErrors).toBe(false);
    });

    it('should find multiple mermaid blocks', () => {
      const markdownText = `\`\`\`mermaid\ngraph TD\nA --> B\n\`\`\`\n\n\`\`\`mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n\`\`\``;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).findMermaidBlocks(mockDocument);

      expect(result).toHaveLength(2);
      expect(result[0].diagramType).toBe('flowchart');
      expect(result[1].diagramType).toBe('sequence');
    });

    it('should return empty array when no mermaid blocks', () => {
      const markdownText = `# Regular markdown\n\nSome text content.`;
      mockDocument = new (vscode as any).TextDocument(markdownText);
      const result = (provider as any).findMermaidBlocks(mockDocument);

      expect(result).toEqual([]);
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
