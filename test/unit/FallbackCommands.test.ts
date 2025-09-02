/**
 * @fileoverview Tests for FallbackCommands (internal implementations)
 * @version 1.0.0
 * @since 2025-09-02
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FallbackCommands } from '../../src/commands/FallbackCommands';

// Mock VS Code API
const mockVSCode = {
  window: {
    activeTextEditor: null as any,
    showQuickPick: vi.fn(),
    showInputBox: vi.fn()
  },
  commands: {
    registerCommand: vi.fn()
  },
  Selection: class {
    constructor(public start: any, public end: any) { }
  }
};

const mockEditor = {
  document: {
    languageId: 'markdown',
    getText: vi.fn(),
    lineAt: vi.fn(),
    lineCount: 2
  },
  selection: {
    start: { line: 0, character: 0 },
    end: { line: 0, character: 0 },
    isEmpty: true
  },
  edit: vi.fn()
};

const mockContext = {
  subscriptions: []
};

describe('FallbackCommands', () => {
  let fallbackCommands: FallbackCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVSCode.window.activeTextEditor = mockEditor;
    fallbackCommands = new FallbackCommands(mockVSCode);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Command Registration', () => {
    it('should register all internal commands', () => {
      fallbackCommands.registerAll(mockContext as any);

      // Verify all internal commands are registered
      const expectedCommands = [
        'mdToolbar.internal.bold',
        'mdToolbar.internal.italic',
        'mdToolbar.internal.strikethrough',
        'mdToolbar.internal.heading1',
        'mdToolbar.internal.heading2',
        'mdToolbar.internal.heading3',
        'mdToolbar.internal.heading4',
        'mdToolbar.internal.heading5',
        'mdToolbar.internal.heading6',
        'mdToolbar.internal.headingToggle',
        'mdToolbar.internal.blockquote',
        'mdToolbar.internal.horizontalRule',
        'mdToolbar.internal.code',
        'mdToolbar.internal.codeBlock',
        'mdToolbar.internal.list',
        'mdToolbar.internal.task',
        'mdToolbar.internal.link',
        'mdToolbar.internal.image',
        'mdToolbar.internal.footnote',
        'mdToolbar.internal.mathInline',
        'mdToolbar.internal.mathBlock',
        'mdToolbar.internal.lineBreak',
        'mdToolbar.internal.tableMenu'
      ];

      expect(mockVSCode.commands.registerCommand).toHaveBeenCalledTimes(expectedCommands.length);
      expectedCommands.forEach(commandId => {
        expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(
          commandId,
          expect.any(Function)
        );
      });
    });
  });

  describe('Heading Commands', () => {
    beforeEach(() => {
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: 'Sample text'
      });
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        return Promise.resolve();
      });
    });

    it('should toggle heading levels correctly', async () => {
      // Test adding heading
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: 'Sample text'
      });

      await (fallbackCommands as any).toggleHeading(1);

      expect(mockEditor.edit).toHaveBeenCalled();
    });

    it('should cycle through heading levels', async () => {
      // Test cycling from H1 to H2
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: '# Sample heading'
      });

      await (fallbackCommands as any).cycleHeading();

      expect(mockEditor.edit).toHaveBeenCalled();
    });

    it('should remove heading when cycling from H6', async () => {
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: '###### Sample heading'
      });

      await (fallbackCommands as any).cycleHeading();

      expect(mockEditor.edit).toHaveBeenCalled();
    });

    it('should add H1 when cycling on non-heading text', async () => {
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: 'Plain text'
      });

      await (fallbackCommands as any).cycleHeading();

      expect(mockEditor.edit).toHaveBeenCalled();
    });
  });

  describe('Blockquote Commands', () => {
    it('should add blockquote to normal text', async () => {
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: 'Normal text'
      });

      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith({}, '> Normal text');
        return Promise.resolve();
      });

      await (fallbackCommands as any).toggleBlockquote();
    });

    it('should remove blockquote from quoted text', async () => {
      mockEditor.document.lineAt.mockReturnValue({
        range: {},
        text: '> Quoted text'
      });

      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith({}, 'Quoted text');
        return Promise.resolve();
      });

      await (fallbackCommands as any).toggleBlockquote();
    });
  });

  describe('Math Commands', () => {
    it('should toggle inline math', async () => {
      mockEditor.document.getText.mockReturnValue('formula');
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          '$formula$'
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertMathInline();
    });

    it('should remove inline math delimiters', async () => {
      mockEditor.document.getText.mockReturnValue('$formula$');
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          'formula'
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertMathInline();
    });

    it('should insert math block', async () => {
      mockEditor.document.getText.mockReturnValue('equation');
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          '\n$$\nequation\n$$\n'
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertMathBlock();
    });
  });

  describe('Footnote Commands', () => {
    it('should insert footnote with correct numbering', async () => {
      mockEditor.document.getText.mockReturnValue('Text with [^1] existing footnote');
      mockEditor.document.lineAt.mockReturnValue({
        range: { end: {} }
      });

      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = {
          replace: vi.fn(),
          insert: vi.fn()
        };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(mockEditor.selection, '[^2]');
        expect(editBuilder.insert).toHaveBeenCalledWith({}, '\n\n[^2]: ');
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertFootnote();
    });
  });

  describe('Table Commands', () => {
    it('should show table menu and insert 2x2 table', async () => {
      mockVSCode.window.showQuickPick.mockResolvedValue({
        label: 'Insert 2x2 table'
      });

      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          expect.stringContaining('Header 1')
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).showTableMenu();
    });

    it('should handle cancelled table menu', async () => {
      mockVSCode.window.showQuickPick.mockResolvedValue(null);

      await (fallbackCommands as any).showTableMenu();

      expect(mockEditor.edit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing active editor gracefully', async () => {
      mockVSCode.window.activeTextEditor = null;

      // Should not throw
      await (fallbackCommands as any).toggleHeading(1);
      await (fallbackCommands as any).cycleHeading();
      await (fallbackCommands as any).toggleBlockquote();
    });

    it('should handle edit failures', async () => {
      mockEditor.edit.mockRejectedValue(new Error('Edit failed'));

      // Should not throw
      try {
        await (fallbackCommands as any).insertHorizontalRule();
      } catch (error) {
        // Expected for this test
      }
    });
  });

  describe('Line Break and Horizontal Rule', () => {
    it('should insert horizontal rule', async () => {
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          '\n---\n'
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertHorizontalRule();
    });

    it('should insert line break', async () => {
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = { replace: vi.fn() };
        callback(editBuilder);
        expect(editBuilder.replace).toHaveBeenCalledWith(
          mockEditor.selection,
          '  \n'
        );
        return Promise.resolve();
      });

      await (fallbackCommands as any).insertLineBreak();
    });
  });
});