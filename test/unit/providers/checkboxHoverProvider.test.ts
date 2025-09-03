import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { CheckboxHoverProvider } from '../../../src/providers/checkboxHoverProvider';

describe('CheckboxHoverProvider', () => {
  let provider: CheckboxHoverProvider;
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

    provider = new CheckboxHoverProvider(mockContext);
    mockDocument = new (vscode as any).TextDocument();
  });

  describe('provideHover', () => {
    it('should return hover information for checked checkbox', async () => {
      const markdownText = `- [x] Completed task`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 4); // Position on the checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should return hover information for unchecked checkbox', async () => {
      const markdownText = `- [ ] Unchecked task`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 4); // Position on the checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should handle indented checkboxes', async () => {
      const markdownText = `  - [x] Indented completed task`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 6); // Position on the checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should handle numbered list checkboxes', async () => {
      const markdownText = `1. [ ] Numbered item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 5); // Position on the checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should handle different bullet types', async () => {
      const markdownText = `* [x] Bullet item\n+ [ ] Plus item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 4); // Position on first checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeDefined();
      expect(result?.contents).toBeDefined();
      expect(result?.range).toBeDefined();
    });

    it('should return null for non-checkbox positions', async () => {
      const markdownText = `Regular text without checkbox`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 10); // Position in regular text
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeUndefined();
    });

    it('should handle position outside checkbox range', async () => {
      const markdownText = `- [x] Checked item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 10); // Position after checkbox
      const result = await provider.provideHover(mockDocument, position, {} as any);

      expect(result).toBeUndefined();
    });
  });

  describe('findCheckboxAtPosition', () => {
    it('should find checkbox at valid position', () => {
      const markdownText = `- [x] Test item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 4);
      const result = (provider as any).findCheckboxAtPosition(mockDocument, position);

      expect(result).toBeDefined();
      expect(result?.checked).toBe(true);
      expect(result?.content).toBe('Test item');
    });

    it('should return null for invalid position', () => {
      const markdownText = `No checkbox here`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const position = new vscode.Position(0, 5);
      const result = (provider as any).findCheckboxAtPosition(mockDocument, position);

      expect(result).toBeNull();
    });
  });
});
