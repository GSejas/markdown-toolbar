/**
 * @fileoverview Tests for core format commands (Bold, Italic, Strikethrough, etc.)
 * @version 1.0.0
 * @since 2025-09-02
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoldCommand } from '../../../src/commands/format/BoldCommand';
import { ItalicCommand } from '../../../src/commands/format/ItalicCommand';
import { StrikethroughCommand } from '../../../src/commands/format/StrikethroughCommand';

// Mock VS Code API
const mockVSCode = {
    window: {
        activeTextEditor: null as any,
    },
    Selection: class {
        constructor(public start: any, public end: any) { }
    }
};

const createMockEditor = (content: string = '', languageId: string = 'markdown') => ({
    document: {
        languageId,
        getText: vi.fn().mockReturnValue(content),
    },
    selection: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: content.length }
    },
    edit: vi.fn().mockResolvedValue(true)
});

describe('Core Format Commands', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('BoldCommand', () => {
        const boldCommand = new BoldCommand();

        it('should add bold formatting to selected text', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await boldCommand.execute();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '**hello**'
            );
        });

        it('should remove bold formatting when text is already bold', async () => {
            const mockEditor = createMockEditor('**hello**');
            mockVSCode.window.activeTextEditor = mockEditor;

            await boldCommand.execute();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                'hello'
            );
        });

        it('should not execute if no active editor', async () => {
            mockVSCode.window.activeTextEditor = null;

            await boldCommand.execute();

            expect(mockVSCode.window.activeTextEditor).toBeNull();
        });

        it('should not execute if not markdown file', async () => {
            const mockEditor = createMockEditor('hello', 'text');
            mockVSCode.window.activeTextEditor = mockEditor;

            await boldCommand.execute();

            expect(mockEditor.edit).not.toHaveBeenCalled();
        });
    });

    describe('ItalicCommand', () => {
        const italicCommand = new ItalicCommand();

        it('should add italic formatting to selected text', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await italicCommand.execute();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '*hello*'
            );
        });

        it('should remove italic formatting with asterisks', async () => {
            const mockEditor = createMockEditor('*hello*');
            mockVSCode.window.activeTextEditor = mockEditor;

            await italicCommand.execute();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                'hello'
            );
        });

        it('should remove italic formatting with underscores', async () => {
            const mockEditor = createMockEditor('_hello_');
            mockVSCode.window.activeTextEditor = mockEditor;

            await italicCommand.execute();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                'hello'
            );
        });

        it('should not remove bold formatting (double asterisks)', async () => {
            const mockEditor = createMockEditor('**hello**');
            mockVSCode.window.activeTextEditor = mockEditor;

            await italicCommand.execute();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '***hello***'
            );
        });
    });

    describe('StrikethroughCommand', () => {
        const strikeCommand = new StrikethroughCommand();

        it('should add strikethrough formatting to selected text', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await strikeCommand.execute();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '~~hello~~'
            );
        });

        it('should remove strikethrough formatting when already present', async () => {
            const mockEditor = createMockEditor('~~hello~~');
            mockVSCode.window.activeTextEditor = mockEditor;

            await strikeCommand.execute();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                'hello'
            );
        });

        it('should handle empty selection by adding strikethrough template', async () => {
            const mockEditor = createMockEditor('');
            mockEditor.selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
            mockVSCode.window.activeTextEditor = mockEditor;

            await strikeCommand.execute();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '~~~~'
            );
        });
    });
});
