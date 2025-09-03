/**
 * @moduleName: CheckboxCodeLensProvider Tests - Unit tests for checkbox code lens functionality
 * @version: 1.0.0
 * @since: 2025-01-15
 * @lastUpdated: 2025-01-15
 * @projectSummary: VS Code extension for markdown formatting toolbar
 * @techStack: TypeScript, VS Code Extension API, Vitest
 * @dependency: vscode, vitest
 * @interModuleDependency: CheckboxCodeLensProvider, CheckboxItem
 * @requirementsTraceability: {@link Requirements.REQ_TEST_COVERAGE}
 * @briefDescription: Unit tests for CheckboxCodeLensProvider to ensure proper code lens generation and checkbox detection
 * @methods: provideCodeLenses, resolveCodeLens, findCheckboxItems
 * @contributors: AI Assistant
 * @examples: Basic code lens provision, checkbox item detection, code lens resolution
 * @vulnerabilitiesAssessment: No security concerns for unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { CheckboxCodeLensProvider } from '../../../src/providers/checkboxCodeLensProvider';

describe('CheckboxCodeLensProvider', () => {
  let provider: CheckboxCodeLensProvider;
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

    provider = new CheckboxCodeLensProvider(mockContext);
    mockDocument = new (vscode as any).TextDocument();
  });

  describe('provideCodeLenses', () => {
    it('should return empty array when no checkboxes found', async () => {
      mockDocument = new (vscode as any).TextDocument('No checkboxes here\nJust plain text');

      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toEqual([]);
    });

    it('should provide code lenses for checkbox items', async () => {
      const markdownText = `- [ ] Unchecked item\n- [x] Checked item\n- [X] Another checked item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('range');
      expect(result[0]).toHaveProperty('command');
      expect(result[1]).toHaveProperty('range');
      expect(result[1]).toHaveProperty('command');
      expect(result[2]).toHaveProperty('range');
      expect(result[2]).toHaveProperty('command');
    });

    it('should handle mixed list types with checkboxes', async () => {
      const markdownText = `- [ ] Bullet item\n1. [x] Numbered item\n* [ ] Another bullet`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const result = await provider.provideCodeLenses(mockDocument, {} as any);

      expect(result).toHaveLength(3);
      result.forEach(codeLens => {
        expect(codeLens).toHaveProperty('range');
        expect(codeLens).toHaveProperty('command');
      });
    });
  });

  describe('resolveCodeLens', () => {
    it('should return the code lens as-is since it is already resolved', () => {
      const mockCodeLens = { range: {}, command: {} } as vscode.CodeLens;
      const token = {} as vscode.CancellationToken;

      const result = provider.resolveCodeLens(mockCodeLens, token);

      expect(result).toBe(mockCodeLens);
    });
  });

  describe('findCheckboxItems', () => {
    it('should find unchecked checkbox items', () => {
      const markdownText = `- [ ] Unchecked item\nSome text\n- [x] Checked item`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const items = (provider as any).findCheckboxItems(mockDocument);

      expect(items).toHaveLength(2);
      expect(items[0].checked).toBe(false);
      expect(items[0].content).toBe('Unchecked item');
      expect(items[1].checked).toBe(true);
      expect(items[1].content).toBe('Checked item');
    });

    it('should handle indented checkboxes', () => {
      const markdownText = `  - [x] Indented checked item\n    - [ ] Nested unchecked`;
      mockDocument = new (vscode as any).TextDocument(markdownText);

      const items = (provider as any).findCheckboxItems(mockDocument);

      expect(items).toHaveLength(2);
      expect(items[0].checked).toBe(true);
      expect(items[1].checked).toBe(false);
    });

    it('should return empty array when no checkboxes found', () => {
      mockDocument = new (vscode as any).TextDocument('No checkboxes here\nJust plain text');

      const items = (provider as any).findCheckboxItems(mockDocument);

      expect(items).toEqual([]);
    });
  });
});
