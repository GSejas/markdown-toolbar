/**
 * @moduleName: VS Code Mock - Complete VS Code API Mock for Testing
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: VS Code Extension for context-aware markdown formatting toolbar
 * @techStack: TypeScript, Vitest, VS Code API
 * @dependency: vitest
 * @interModuleDependency: None
 * @requirementsTraceability: Testing infrastructure
 * @briefDescription: Comprehensive mock of VS Code API for unit testing with proper Position, Selection, and TextEditor implementations
 * @methods: Position, Selection, Range, TextEditor, workspace, window, commands
 * @contributors: GitHub Copilot
 * @examples: import * as vscode from 'vscode' // automatically resolves to this mock in tests
 * @vulnerabilitiesAssessment: Test-only mock, no security concerns
 */

import { vi } from 'vitest';

// Mock Position class
export class Position {
    constructor(public line: number, public character: number) { }

    translate(lineDelta: number, characterDelta: number): Position {
        return new Position(this.line + lineDelta, this.character + characterDelta);
    }

    with(line?: number, character?: number): Position {
        return new Position(
            line !== undefined ? line : this.line,
            character !== undefined ? character : this.character
        );
    }

    isAfter(other: Position): boolean {
        return this.line > other.line || (this.line === other.line && this.character > other.character);
    }

    isBefore(other: Position): boolean {
        return this.line < other.line || (this.line === other.line && this.character < other.character);
    }

    isEqual(other: Position): boolean {
        return this.line === other.line && this.character === other.character;
    }
}

// Mock EndOfLine enum
export enum EndOfLine {
    LF = 1,
    CRLF = 2,
}

// Mock Range class with numeric overload support
export class Range {
    public start: Position;
    public end: Position;

    constructor(start: Position | number, end: Position | number, endLine?: number, endCharacter?: number) {
        if (typeof start === 'number' && typeof end === 'number' && typeof endLine === 'number' && typeof endCharacter === 'number') {
            this.start = new Position(start, end);
            this.end = new Position(endLine, endCharacter);
        } else if (start instanceof Position && end instanceof Position) {
            this.start = start;
            this.end = end;
        } else {
            // Fallback for unexpected usages
            this.start = start instanceof Position ? start : new Position(0, 0);
            this.end = end instanceof Position ? end : new Position(0, 0);
        }
    }

    isEmpty(): boolean {
        return this.start.isEqual(this.end);
    }

    isSingleLine(): boolean {
        return this.start.line === this.end.line;
    }

    contains(positionOrRange: Position | Range): boolean {
        if (positionOrRange instanceof Position) {
            return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
        }
        return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
    }
}

// Mock CodeLens class
class CodeLens {
    constructor(public range: Range, public command?: any, public isResolved?: boolean) {}
}

// Mock Hover class
class Hover {
    constructor(public contents: any[], public range?: Range) {}
}
class MarkdownString {
    constructor(value?: string) {
        this.value = value || '';
    }
    value: string = '';
    isTrusted: boolean = false;
    supportHtml: boolean = false;

    appendMarkdown(value: string): MarkdownString {
        this.value += value;
        return this;
    }

    appendText(value: string): MarkdownString {
        this.value += value;
        return this;
    }
}
export class Selection extends Range {
    constructor(start: Position, end: Position) {
        super(start, end);
    }

    get anchor(): Position {
        return this.start;
    }

    get active(): Position {
        return this.end;
    }

    get isReversed(): boolean {
        return this.anchor.isAfter(this.active);
    }
}

// Mock TextLine class
export class TextLine {
    constructor(
        public text: string,
        public lineNumber: number,
        public range: Range,
        public rangeIncludingLineBreak: Range,
        public firstNonWhitespaceCharacterIndex: number,
        public isEmptyOrWhitespace: boolean
    ) { }
}

// Mock TextDocument class
export class TextDocument {
    public uri = { fsPath: '/test/file.md', scheme: 'file' };
    public fileName = '/test/file.md';
    public isUntitled = false;
    public languageId = 'markdown';
    public version = 1;
    public isDirty = false;
    public isClosed = false;
    public eol = EndOfLine.LF;
    public lineCount = 1;

    constructor(public content: string = '') {
        this.lineCount = content.split('\n').length;
    }

    save = vi.fn().mockResolvedValue(true);
    getText = vi.fn().mockImplementation((range?: Range) => {
        if (range) {
            const lines = this.content.split('\n');
            if (range.isSingleLine()) {
                return lines[range.start.line]?.substring(range.start.character, range.end.character) || '';
            }
            // Multi-line range implementation
            const startLine = lines[range.start.line]?.substring(range.start.character) || '';
            const middleLines = lines.slice(range.start.line + 1, range.end.line);
            const endLine = lines[range.end.line]?.substring(0, range.end.character) || '';
            return [startLine, ...middleLines, endLine].join('\n');
        }
        return this.content;
    });

    lineAt = vi.fn().mockImplementation((lineOrPosition: number | Position) => {
        const lineNumber = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        const lines = this.content.split('\n');
        const text = lines[lineNumber] || '';
        return new TextLine(
            text,
            lineNumber,
            new Range(new Position(lineNumber, 0), new Position(lineNumber, text.length)),
            new Range(new Position(lineNumber, 0), new Position(lineNumber, text.length + 1)),
            text.search(/\S/),
            text.trim().length === 0
        );
    });

    positionAt = vi.fn().mockImplementation((offset: number) => {
        const lines = this.content.substring(0, offset).split('\n');
        return new Position(lines.length - 1, lines[lines.length - 1].length);
    });

    offsetAt = vi.fn().mockImplementation((position: Position) => {
        const lines = this.content.split('\n');
        let offset = 0;
        for (let i = 0; i < position.line && i < lines.length; i++) {
            offset += lines[i].length + 1; // +1 for newline
        }
        return offset + position.character;
    });

    getWordRangeAtPosition = vi.fn();
    validateRange = vi.fn().mockImplementation((range: Range) => range);
    validatePosition = vi.fn().mockImplementation((position: Position) => position);
}

// Mock TextEditor class
export class TextEditor {
    public document: TextDocument;
    public selection: Selection;
    public selections: Selection[] = [];
    public visibleRanges: Range[] = [];
    public options = { tabSize: 4, insertSpaces: true };
    public viewColumn: any;

    constructor(content: string = '') {
        this.document = new TextDocument(content);
        this.selection = new Selection(new Position(0, 0), new Position(0, 0));
        this.selections = [this.selection];
    }

    edit = vi.fn().mockImplementation((callback: (editBuilder: any) => void) => {
        const editBuilder = {
            replace: vi.fn(),
            insert: vi.fn(),
            delete: vi.fn()
        };
        callback(editBuilder);
        return Promise.resolve(true);
    });

    insertSnippet = vi.fn().mockResolvedValue(true);
    setDecorations = vi.fn();
    revealRange = vi.fn();
    show = vi.fn();
    hide = vi.fn();
}

// Mock workspace API
const workspace = {
    getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
            // Mock configuration values
            const config: Record<string, any> = {
                enabled: true,
                position: 'right',
                buttons: ['bold', 'italic', 'code', 'link', 'list'],
                preset: 'default',
                customButtons: []
            };
            return config[key] !== undefined ? config[key] : defaultValue;
        }),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined)
    }),
    onDidChangeConfiguration: vi.fn(),
    workspaceFolders: [],
    name: 'test-workspace',
    asRelativePath: vi.fn(),
    findFiles: vi.fn(),
    openTextDocument: vi.fn(),
    registerTextDocumentContentProvider: vi.fn(),
    createFileSystemWatcher: vi.fn(),
    onDidOpenTextDocument: vi.fn(),
    onDidCloseTextDocument: vi.fn(),
    onDidChangeTextDocument: vi.fn(),
    onDidSaveTextDocument: vi.fn()
};

// Mock window API
const window = {
    activeTextEditor: new TextEditor(),
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: vi.fn(),
    onDidChangeVisibleTextEditors: vi.fn(),
    onDidChangeTextEditorSelection: vi.fn(),
    onDidChangeTextEditorVisibleRanges: vi.fn(),
    onDidChangeTextEditorOptions: vi.fn(),
    onDidChangeTextEditorViewColumn: vi.fn(),
    showTextDocument: vi.fn(),
    createTextEditorDecorationType: vi.fn(),
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showInputBox: vi.fn().mockResolvedValue('user-input'),
    showQuickPick: vi.fn().mockResolvedValue('selected-item'),
    createStatusBarItem: vi.fn().mockReturnValue({
        text: '',
        tooltip: '',
        command: '',
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn()
    }),
    createOutputChannel: vi.fn(),
    createWebviewPanel: vi.fn(),
    registerUriHandler: vi.fn(),
    registerWebviewPanelSerializer: vi.fn(),
    setStatusBarMessage: vi.fn(),
    withProgress: vi.fn(),
    createTreeView: vi.fn(),
    registerTreeDataProvider: vi.fn()
};

// Mock commands API
const commands = {
    registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    registerTextEditorCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    executeCommand: vi.fn().mockResolvedValue(undefined),
    getCommands: vi.fn().mockResolvedValue([])
};

// Mock languages API
const languages = {
    registerCompletionItemProvider: vi.fn(),
    registerHoverProvider: vi.fn(),
    registerDefinitionProvider: vi.fn(),
    registerCodeActionsProvider: vi.fn(),
    registerDocumentFormattingEditProvider: vi.fn(),
    createDiagnosticCollection: vi.fn()
};

// Mock extensions API
const extensions = {
    getExtension: vi.fn(),
    all: []
};

// Mock environment API
const env = {
    appName: 'Visual Studio Code',
    appRoot: '/app',
    language: 'en',
    clipboard: {
        readText: vi.fn().mockResolvedValue(''),
        writeText: vi.fn().mockResolvedValue(undefined)
    },
    machineId: 'test-machine',
    sessionId: 'test-session',
    shell: '/bin/bash',
    uriScheme: 'vscode'
};

// Mock Uri class
class Uri {
    constructor(
        public scheme: string,
        public authority: string,
        public path: string,
        public query: string,
        public fragment: string
    ) { }

    static file(path: string): Uri {
        return new Uri('file', '', path, '', '');
    }

    static parse(value: string): Uri {
        return new Uri('file', '', value, '', '');
    }

    toString(): string {
        return `${this.scheme}://${this.authority}${this.path}`;
    }

    toJSON(): any {
        return {
            scheme: this.scheme,
            authority: this.authority,
            path: this.path,
            query: this.query,
            fragment: this.fragment
        };
    }
}

// Mock Disposable class
class Disposable {
    constructor(private callOnDispose: () => void) { }

    dispose(): void {
        this.callOnDispose();
    }

    static from(...disposables: { dispose(): any }[]): Disposable {
        return new Disposable(() => {
            disposables.forEach(d => d.dispose());
        });
    }
}

// Mock ConfigurationTarget enum
enum ConfigurationTarget {
    Global = 1,
    Workspace = 2,
    WorkspaceFolder = 3
}

// Mock StatusBarAlignment enum
enum StatusBarAlignment {
    Left = 1,
    Right = 2
}

// Export all mocked modules
export {
    workspace,
    window,
    commands,
    languages,
    extensions,
    env,
    Uri,
    Disposable,
    ConfigurationTarget,
    StatusBarAlignment,
    CodeLens,
    MarkdownString,
    Hover
};
