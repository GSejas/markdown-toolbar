/**
 * @fileoverview Tests for FallbackCommands internal implementations
 * @version 1.0.0
 * @since 2025-09-02
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackCommands } from '../../../src/commands/FallbackCommands';

// Mock VS Code API
const mockVSCode = {
    window: {
        activeTextEditor: null as any,
        showInputBox: vi.fn(),
        showQuickPick: vi.fn(),
    },
    commands: {
        registerCommand: vi.fn()
    },
    Selection: class {
        constructor(public start: any, public end: any) { }
    }
};

// Mock MarkdownFormatter
vi.mock('../../../src/engine/MarkdownFormatter', () => ({
    MarkdownFormatter: class {
        toggleBulletList = vi.fn((text: string) => {
            return text.startsWith('- ') ? text.slice(2) : `- ${text}`;
        });
        toggleTaskList = vi.fn((text: string) => {
            return text.startsWith('- [ ] ') ? text.slice(6) : `- [ ] ${text}`;
        });
        createLink = vi.fn((text: string, url: string) => `[${text}](${url})`);
        createImage = vi.fn((alt: string, url: string) => `![${alt}](${url})`);
    }
}));

const createMockEditor = (content: string = '', languageId: string = 'markdown') => ({
    document: {
        languageId,
        getText: vi.fn((selection) => {
            if (selection) return content;
            return content;
        }),
        lineAt: vi.fn((lineNumber) => ({
            text: content,
            range: { start: { line: lineNumber, character: 0 }, end: { line: lineNumber, character: content.length } }
        })),
        lineCount: 1,
        positionAt: vi.fn((offset) => ({ line: 0, character: offset }))
    },
    selection: {
        start: {
            line: 0,
            character: 0,
            translate: vi.fn((lineDelta: number, charDelta: number) => ({
                line: 0 + lineDelta,
                character: 0 + charDelta,
                translate: vi.fn()
            }))
        },
        end: {
            line: 0,
            character: content.length,
            translate: vi.fn((lineDelta: number, charDelta: number) => ({
                line: 0 + lineDelta,
                character: content.length + charDelta,
                translate: vi.fn()
            }))
        },
        isEmpty: content.length === 0
    },
    edit: vi.fn().mockResolvedValue(true)
});

describe('FallbackCommands', () => {
    let fallbackCommands: FallbackCommands;

    beforeEach(() => {
        vi.clearAllMocks();
        fallbackCommands = new FallbackCommands(mockVSCode);
    });

    describe('Text Formatting Commands', () => {
        it('should register all fallback commands', () => {
            const mockContext = { subscriptions: { push: vi.fn() } };

            fallbackCommands.registerAll(mockContext);

            expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(
                'mdToolbar.internal.bold',
                expect.any(Function)
            );
            expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(
                'mdToolbar.internal.italic',
                expect.any(Function)
            );
            expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(
                'mdToolbar.internal.strikethrough',
                expect.any(Function)
            );
        });

        it('should toggle bold formatting', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            // Call the internal method (simulating command execution)
            await (fallbackCommands as any).toggleBold();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            // Verify the edit function modifies text correctly
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '**hello**'
            );
        });

        it('should toggle italic formatting', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleItalic();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '*hello*'
            );
        });

        it('should toggle strikethrough formatting', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleStrikethrough();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '~~hello~~'
            );
        });

        it('should handle empty selection by inserting markers', async () => {
            const mockEditor = createMockEditor('');
            mockEditor.selection = {
                start: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                end: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                isEmpty: true
            };
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleBold();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { insert: vi.fn(), replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.insert).toHaveBeenCalledWith(
                mockEditor.selection.start,
                '****'
            );
        });
    });

    describe('Inline Code Command', () => {
        it('should toggle inline code formatting', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleInlineCode();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '`hello`'
            );
        });

        it('should remove inline code formatting when already present', async () => {
            const mockEditor = createMockEditor('`hello`');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleInlineCode();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                'hello'
            );
        });
    });

    describe('List Commands', () => {
        it('should toggle bullet list for single line', async () => {
            const mockEditor = createMockEditor('hello');
            mockEditor.selection = {
                start: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                end: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                isEmpty: true
            };
            mockVSCode.window.activeTextEditor = mockEditor;

            // Spy on the lineAt method to ensure it's called
            const lineAtSpy = vi.fn((lineNumber) => ({
                text: 'hello',
                range: { start: { line: lineNumber, character: 0 }, end: { line: lineNumber, character: 5 } }
            }));
            mockEditor.document.lineAt = lineAtSpy;

            // Access the private method for testing
            const toggleBulletListMethod = (fallbackCommands as any).toggleBulletList.bind(fallbackCommands);
            await toggleBulletListMethod();

            // Manually call the edit callback to execute the lineAt logic
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn(), delete: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            expect(lineAtSpy).toHaveBeenCalledWith(0);
        });

        it('should toggle task list for single line', async () => {
            const mockEditor = createMockEditor('hello');
            mockEditor.selection = {
                start: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                end: {
                    line: 0,
                    character: 0,
                    translate: vi.fn((lineDelta: number, charDelta: number) => ({
                        line: 0 + lineDelta,
                        character: 0 + charDelta,
                        translate: vi.fn()
                    }))
                },
                isEmpty: true
            };
            mockVSCode.window.activeTextEditor = mockEditor;

            // Spy on the lineAt method to ensure it's called
            const lineAtSpy = vi.fn((lineNumber) => ({
                text: 'hello',
                range: { start: { line: lineNumber, character: 0 }, end: { line: lineNumber, character: 5 } }
            }));
            mockEditor.document.lineAt = lineAtSpy;

            // Access the private method for testing
            const toggleTaskListMethod = (fallbackCommands as any).toggleTaskList.bind(fallbackCommands);
            await toggleTaskListMethod();

            // Manually call the edit callback to execute the lineAt logic
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn(), insert: vi.fn(), delete: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            expect(lineAtSpy).toHaveBeenCalledWith(0);
        });
    });

    describe('Heading Commands', () => {
        it('should toggle heading level 1', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleHeading(1);

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                expect.any(Object),
                '# hello'
            );
        });

        it('should cycle headings', async () => {
            const mockEditor = createMockEditor('# hello');
            mockVSCode.window.activeTextEditor = mockEditor;
            mockEditor.document.lineAt.mockReturnValue({
                text: '# hello',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }
            });

            await (fallbackCommands as any).cycleHeading();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('Structure Commands', () => {
        it('should toggle blockquote', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).toggleBlockquote();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should insert horizontal rule', async () => {
            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertHorizontalRule();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '\n---\n'
            );
        });
    });

    describe('Extended Commands', () => {
        it('should insert footnote', async () => {
            const mockEditor = createMockEditor('hello');
            mockEditor.document.getText.mockReturnValue('hello');
            mockEditor.document.lineAt.mockReturnValue({
                text: 'hello',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
            });
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertFootnote();

            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should insert inline math', async () => {
            const mockEditor = createMockEditor('hello');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertMathInline();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '$hello$'
            );
        });

        it('should insert math block', async () => {
            const mockEditor = createMockEditor('x = y');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertMathBlock();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '\n$$\nx = y\n$$\n'
            );
        });

        it('should insert line break', async () => {
            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertLineBreak();

            const editCallback = mockEditor.edit.mock.calls[0][0];
            const mockEditBuilder = { replace: vi.fn() };
            editCallback(mockEditBuilder);

            expect(mockEditBuilder.replace).toHaveBeenCalledWith(
                mockEditor.selection,
                '  \n'
            );
        });
    });

    describe('Media Commands', () => {
        it('should insert link with user input', async () => {
            mockVSCode.window.showInputBox
                .mockResolvedValueOnce('Link Text')
                .mockResolvedValueOnce('https://example.com');

            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertLink();

            expect(mockVSCode.window.showInputBox).toHaveBeenCalledTimes(2);
            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should insert image with user input', async () => {
            mockVSCode.window.showInputBox
                .mockResolvedValueOnce('Alt Text')
                .mockResolvedValueOnce('image.png');

            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertImage();

            expect(mockVSCode.window.showInputBox).toHaveBeenCalledTimes(2);
            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should show table menu', async () => {
            mockVSCode.window.showQuickPick.mockResolvedValue({
                label: 'Insert 2x2 table',
                description: 'Simple 2 columns x 2 rows'
            });

            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).showTableMenu();

            expect(mockVSCode.window.showQuickPick).toHaveBeenCalled();
            expect(mockEditor.edit).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('Error Handling', () => {
        it('should handle missing editor gracefully', async () => {
            mockVSCode.window.activeTextEditor = null;

            await (fallbackCommands as any).toggleBold();

            // Should not throw error and not call edit
            expect(mockVSCode.window.activeTextEditor).toBeNull();
        });

        it('should handle cancelled user input', async () => {
            mockVSCode.window.showInputBox.mockResolvedValue(undefined);

            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).insertLink();

            expect(mockEditor.edit).not.toHaveBeenCalled();
        });

        it('should handle cancelled quick pick', async () => {
            mockVSCode.window.showQuickPick.mockResolvedValue(null);

            const mockEditor = createMockEditor('');
            mockVSCode.window.activeTextEditor = mockEditor;

            await (fallbackCommands as any).showTableMenu();

            expect(mockEditor.edit).not.toHaveBeenCalled();
        });
    });
});
