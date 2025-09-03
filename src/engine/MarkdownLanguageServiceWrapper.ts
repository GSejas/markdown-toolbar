/**
 * @moduleName: Markdown Language Service Wrapper - Microsoft Language Service Integration
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Wrapper for vscode-markdown-languageservice providing robust markdown parsing
 * @techStack: TypeScript, vscode-markdown-languageservice, VS Code API
 * @dependency: vscode-markdown-languageservice, vscode
 * @interModuleDependency: ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PROVIDER_002} (Header Management Support)
 *   {@link Requirements.REQ_UI_003} (Document Navigation)
 * @briefDescription: Provides a clean interface to Microsoft's markdown language service for header extraction, symbol resolution, and document analysis
 * @methods: getDocumentHeaders, getDocumentSymbols, parseDocumentStructure
 * @contributors: VS Code Extension Team
 * @examples:
 *   - const headers = await wrapper.getDocumentHeaders(document);
 *   - const symbols = await wrapper.getDocumentSymbols(document);
 * @vulnerabilitiesAssessment: Input validation, VS Code API sandboxing, proper error handling
 */

import * as md from 'vscode-markdown-languageservice';
import * as vscode from 'vscode';
import { CancellationTokenSource, Event } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';
import { logger } from '../services/Logger';

// Simple EventEmitter implementation for LSP compatibility
class SimpleEventEmitter<T> {
  private listeners: ((e: T) => any)[] = [];

  get event(): Event<T> {
    return (listener: (e: T) => any) => {
      this.listeners.push(listener);
      return { dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }};
    };
  }

  fire(event: T): void {
    this.listeners.forEach(listener => listener(event));
  }
}

export interface HeaderInfo {
  level: number;
  title: string;
  line: number;
  range: vscode.Range;
  anchor: string;
  hasContent: boolean;
  wordCount: number;
}

export interface DocumentStructure {
  headers: HeaderInfo[];
  totalWords: number;
  totalLines: number;
  sectionsCount: number;
}

export class MarkdownLanguageServiceWrapper {
  private languageService: md.IMdLanguageService;
  private workspace: md.IWorkspace;
  private logger: md.ILogger;

  constructor() {
    this.logger = this.createLoggerInterface();
    this.workspace = this.createWorkspaceInterface();

    // Create a simple parser using the default slugifier
    const parser: md.IMdParser = {
      slugifier: md.githubSlugifier,
      tokenize: async (document: md.ITextDocument) => {
        // For now, we'll use the language service's built-in parsing
        // This could be enhanced with a custom tokenizer later
        return [];
      }
    };

    this.languageService = md.createLanguageService({
      workspace: this.workspace,
      parser,
      logger: this.logger
    });

    logger.info('[MarkdownLanguageServiceWrapper] Initialized with default parser');
  }

  /**
   * Extract headers from a markdown document using the language service
   */
  async getDocumentHeaders(document: vscode.TextDocument): Promise<HeaderInfo[]> {
    try {
      logger.info(`[MarkdownLanguageServiceWrapper] Extracting headers from ${document.fileName}`);

      const cts = new CancellationTokenSource();
      const symbols = await this.languageService.getDocumentSymbols(
        this.adaptTextDocument(document),
        { includeLinkDefinitions: false },
        cts.token
      );

      logger.info(`[MarkdownLanguageServiceWrapper] Found ${symbols.length} symbols`);

      const headers: HeaderInfo[] = [];

      for (const symbol of symbols) {
        // Be permissive about symbol kind since different versions may use different kinds for headings
        const possibleHeaderKinds = new Set<number>([13, 14, 15]); // Variable(13), Constant(14), String(15)
        if (possibleHeaderKinds.has((symbol as any).kind)) {
          const header = this.convertSymbolToHeaderInfo(symbol, document);
          if (header.title) {
            headers.push(header);
            logger.info(`[MarkdownLanguageServiceWrapper] Found header: ${header.title} (level ${header.level})`);
          }
        }
      }

      // If language service didn't return headers, fall back to regex-based extraction
      if (headers.length === 0) {
        logger.info('[MarkdownLanguageServiceWrapper] No headers from language service, using fallback extraction');
        return this.fallbackGetDocumentHeaders(document);
      }

      logger.info(`[MarkdownLanguageServiceWrapper] Extracted ${headers.length} headers`);
      return headers;

    } catch (error) {
      logger.error('[MarkdownLanguageServiceWrapper] Error extracting headers:', error);
      // Fallback to empty array to prevent crashes
      return this.fallbackGetDocumentHeaders(document);
    }
  }

  /**
   * Get all document symbols (headers, links, etc.)
   */
  async getDocumentSymbols(document: vscode.TextDocument): Promise<import('vscode-languageserver-protocol').DocumentSymbol[]> {
    try {
      const cts = new CancellationTokenSource();
      const symbols = await this.languageService.getDocumentSymbols(
        this.adaptTextDocument(document),
        { includeLinkDefinitions: true },
        cts.token
      );

      return symbols;
    } catch (error) {
      logger.error('[MarkdownLanguageServiceWrapper] Error getting document symbols:', error);
      return [];
    }
  }

  /**
   * Parse complete document structure including headers and content analysis
   */
  async parseDocumentStructure(document: vscode.TextDocument): Promise<DocumentStructure> {
    try {
      const headers = await this.getDocumentHeaders(document);
      const lines = document.getText().split('\n');

      // Analyze content for each header
      for (const header of headers) {
        const sectionInfo = this.analyzeSectionContent(lines, header.line);
        header.hasContent = sectionInfo.hasContent;
        header.wordCount = sectionInfo.wordCount;
      }

      const totalWords = lines.reduce((sum, line) => sum + this.countWords(line), 0);

      return {
        headers,
        totalWords,
        totalLines: lines.length,
        sectionsCount: headers.length
      };

    } catch (error) {
      logger.error('[MarkdownLanguageServiceWrapper] Error parsing document structure:', error);
      return {
        headers: [],
        totalWords: 0,
        totalLines: document.lineCount,
        sectionsCount: 0
      };
    }
  }

  /**
   * Convert a language service symbol to our HeaderInfo format
   */
  private convertSymbolToHeaderInfo(symbol: import('vscode-languageserver-protocol').DocumentSymbol, document: vscode.TextDocument): HeaderInfo {
    const line = symbol.range.start.line;
    const lineText = document.lineAt(line).text;
    const level = this.extractHeaderLevel(lineText);
    const title = this.extractHeaderTitle(lineText, level);
    const anchor = this.createAnchor(title);

    return {
      level,
      title,
      line,
      range: new vscode.Range(
        symbol.range.start.line,
        symbol.range.start.character,
        symbol.range.end.line,
        symbol.range.end.character
      ),
      anchor,
      hasContent: false, // Will be set by analyzeSectionContent
      wordCount: 0
    };
  }

  /**
   * Extract header level from markdown line
   */
  private extractHeaderLevel(line: string): number {
  const match = line.trim().match(/^(#{1,6})/);
  return match ? match[1].length : 0;
  }

  /**
   * Extract header title from markdown line
   */
  private extractHeaderTitle(line: string, level: number): string {
    return line.trim().replace(/^#{1,6}\s*/, '').trim();
  }

  /**
   * Create anchor from header title (GitHub-style)
   */
  private createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
  }

  /**
   * Analyze content in a section following a header
   */
  private analyzeSectionContent(lines: string[], headerLineIndex: number): { hasContent: boolean; wordCount: number } {
    let wordCount = 0;
    let hasContent = false;
    let i = headerLineIndex + 1;

    // Look for content until next header of same or higher level
  const currentLevel = this.extractHeaderLevel(lines[headerLineIndex] ?? '');

    while (i < lines.length) {
      const line = lines[i];
      const headerLevel = this.extractHeaderLevel(line);

      // Stop at next header of same or higher level
      if (headerLevel > 0 && headerLevel <= currentLevel) {
        break;
      }

      const lineWords = this.countWords(line);
      wordCount += lineWords;

      if (lineWords > 0) {
        hasContent = true;
      }

      i++;
    }

    return { hasContent, wordCount };
  }

  /**
   * Fallback header extraction using simple regex scanning
   */
  private fallbackGetDocumentHeaders(document: vscode.TextDocument): HeaderInfo[] {
    const text = document.getText();
    const lines = text.split('\n');
    const headers: HeaderInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? '';
      const line = raw.trim();
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const anchor = this.createAnchor(title);

        const sectionInfo = this.analyzeSectionContent(lines, i);

        headers.push({
          level,
          title,
          line: i,
          range: new vscode.Range(i, 0, i, raw.length),
          anchor,
          hasContent: sectionInfo.hasContent,
          wordCount: sectionInfo.wordCount
        });
      }
    }

    return headers;
  }

  /**
   * Count words in a line
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Adapt VS Code TextDocument to language service format
   */
  private adaptTextDocument(document: vscode.TextDocument): md.ITextDocument {
    return {
      uri: document.uri.toString(),
      version: document.version,
      lineCount: document.lineCount,
      getText: (range?: import('vscode-languageserver-protocol').Range) => {
        if (range) {
          return document.getText(new vscode.Range(
            range.start.line,
            range.start.character,
            range.end.line,
            range.end.character
          ));
        }
        return document.getText();
      },
      positionAt: (offset: number) => {
        const position = document.positionAt(offset);
        return { line: position.line, character: position.character };
      },
      offsetAt: (position: import('vscode-languageserver-protocol').Position) => {
        return document.offsetAt(new vscode.Position(position.line, position.character));
      }
    };
  }

  /**
   * Create workspace interface for language service
   */
  private createWorkspaceInterface(): md.IWorkspace {
    // Minimal event stubs compatible with lsp.Event signature
    const noopEvent = <T>(): Event<T> => ((listener: (e: T) => any) => ({ dispose() {} } as any));

    return {
      get workspaceFolders(): readonly URI[] {
        return vscode.workspace.workspaceFolders?.map(folder =>
          URI.parse(folder.uri.toString())
        ) || [];
      },
      onDidChangeMarkdownDocument: noopEvent<md.ITextDocument>(),
      onDidCreateMarkdownDocument: noopEvent<md.ITextDocument>(),
      onDidDeleteMarkdownDocument: noopEvent<URI>(),

      getAllMarkdownDocuments(): Promise<Iterable<md.ITextDocument>> {
        // For now, return empty - this could be enhanced to scan workspace
        return Promise.resolve([]);
      },

      hasMarkdownDocument(resource: URI): boolean {
        // Simple check - could be enhanced
        return resource.toString().endsWith('.md');
      },

      async openMarkdownDocument(resource: URI): Promise<md.ITextDocument | undefined> {
        try {
          const uri = vscode.Uri.parse(resource.toString());
          const document = await vscode.workspace.openTextDocument(uri);
          // Create a new instance of the wrapper to access adaptTextDocument
          const wrapper = new MarkdownLanguageServiceWrapper();
          return (wrapper as any).adaptTextDocument(document);
        } catch (error) {
          logger.error(`[MarkdownLanguageServiceWrapper] Error opening document ${resource}:`, error);
          return undefined;
        }
      },

      async stat(resource: URI): Promise<md.FileStat | undefined> {
        try {
          const uri = vscode.Uri.parse(resource.toString());
          const stat = await vscode.workspace.fs.stat(uri);
          return {
            isDirectory: (stat.type & vscode.FileType.Directory) !== 0
          };
        } catch (error) {
          return undefined;
        }
      },

      readDirectory(resource: URI): Promise<Iterable<readonly [string, md.FileStat]>> {
        return (async () => {
          try {
            const uri = vscode.Uri.parse(resource.toString());
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries.map(([name, type]) => [name, { isDirectory: (type & vscode.FileType.Directory) !== 0 }] as const);
          } catch (error) {
            return [];
          }
        })();
      }
    };
  }

  /**
   * Create logger interface for language service
   */
  private createLoggerInterface(): md.ILogger {
    return {
      get level(): md.LogLevel {
        return md.LogLevel.Debug; // Could be configurable
      },

      log(level: md.LogLevel, message: string, data?: Record<string, unknown>): void {
        const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;

        switch (level) {
          case md.LogLevel.Trace:
            logger.debug(`[MarkdownLanguageService] ${logMessage}`);
            break;
          case md.LogLevel.Debug:
            logger.debug(`[MarkdownLanguageService] ${logMessage}`);
            break;
          default:
            logger.info(`[MarkdownLanguageService] ${logMessage}`);
        }
      }
    };
  }
}
