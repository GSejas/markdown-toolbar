import { vi } from 'vitest';

export const createMockEditor = (text: string = '') => {
    return {
        document: {
            getText: vi.fn().mockReturnValue(text),
            lineAt: vi.fn(),
            positionAt: vi.fn((offset: number) => ({ line: 0, character: offset })),
            offsetAt: vi.fn((position: any) => position.character),
            languageId: 'markdown'
        },
        selection: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
        },
        edit: vi.fn().mockResolvedValue(true)
    };
};

export const createMockRange = (startLine = 0, startChar = 0, endLine = 0, endChar = 0) => {
    return {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
    };
};

export const createMockContext = () => {
    return {
        subscriptions: [],
        workspaceState: {
            get: vi.fn(),
            update: vi.fn()
        },
        globalState: {
            get: vi.fn(),
            update: vi.fn()
        },
        extensionPath: '/mock/path',
        storagePath: '/mock/storage',
        globalStoragePath: '/mock/global'
    };
};

export const createMockWorkspaceConfiguration = (values: Record<string, any> = {}) => {
    return {
        get: vi.fn((key: string, defaultValue?: any) => {
            return values[key] !== undefined ? values[key] : defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn((key: string) => key in values),
        inspect: vi.fn()
    };
};
