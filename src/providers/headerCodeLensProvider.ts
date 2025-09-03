/**
 * @moduleName: Header CodeLens Provider - Interactive Header Controls
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: VS Code CodeLens provider for interactive markdown header manipulation and navigation
 * @techStack: TypeScript, VS Code API, Markdown Parsing
 * @dependency: vscode
 * @interModuleDependency: ../engine/ContextDetector, ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PROVIDER_002} (Header Management Support)
 *   {@link Requirements.REQ_UI_003} (Document Navigation)
 * @briefDescription: Provides interactive CodeLens actions above markdown headers including level adjustment (H+ H-), TOC operations, navigation controls, and document structure management
 * @methods: provideCodeLenses, parseHeaders, adjustHeaderLevel, generateTOC, navigateToSection
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Above "# Main Title": Shows "H- | ➕ TOC | 📊 Stats | 🔗 Copy Link"
 *   - Above "### Subsection": Shows "H+ | H- | ⬆️ Move Up | ⬇️ Move Down"
 * @vulnerabilitiesAssessment: Header structure validation, TOC link generation security
 */

import * as vscode from 'vscode';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';
import { MarkdownLanguageServiceWrapper } from '../engine/MarkdownLanguageServiceWrapper';
import { DocumentCache } from '../engine/DocumentCache';
import { withProviderErrorBoundary } from '../utils/ErrorBoundary';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { service } from '../di/ServiceContainer';

interface HeaderInfo {
  level: number;
  title: string;
  line: number;
  range: vscode.Range;
  anchor: string;
  hasContent: boolean;
  wordCount: number;
}

interface DocumentStructure {
  headers: HeaderInfo[];
  totalWords: number;
  totalLines: number;
  sectionsCount: number;
}

@service()
export class HeaderCodeLensProvider implements vscode.CodeLensProvider {
  private contextDetector = new ContextDetector();
  private markdownService = new MarkdownLanguageServiceWrapper();

  constructor(
    private cache: DocumentCache = new DocumentCache()
  ) {
    logger.info('HeaderCodeLensProvider initialized with DI and caching support');
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    return PerformanceMonitor.withTiming(
      () => withProviderErrorBoundary(
        () => this.doProvideCodeLenses(document, token),
        [], // fallback to empty array on error
        'HeaderCodeLensProvider'
      ),
      'HeaderCodeLensProvider.provideCodeLenses',
      200 // Log if takes more than 200ms
    );
  }

  private async doProvideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    logger.info(`[HeaderCodeLens] provideCodeLenses called for ${document.fileName}`);
    logger.info(`[HeaderCodeLens] Document language: ${document.languageId}`);
    logger.info(`[HeaderCodeLens] Token cancelled: ${token.isCancellationRequested}`);

    if (token.isCancellationRequested) {
      logger.info(`[HeaderCodeLens] Cancellation requested, returning empty array`);
      return [];
    }

    if (document.languageId !== 'markdown') {
      logger.info(`[HeaderCodeLens] Skipping non-markdown file: ${document.languageId}`);
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    try {
  const structure = await this.analyzeDocumentStructureAsync(document);
      logger.info(`[HeaderCodeLens] Found ${structure.headers.length} headers in document`);
      logger.info(`[HeaderCodeLens] Document has ${document.lineCount} lines`);

      if (structure.headers.length === 0) {
        logger.info(`[HeaderCodeLens] No headers found - document content preview:`);
        logger.info(`[HeaderCodeLens] First 10 lines: ${document.getText().split('\n').slice(0, 10).join(' | ')}`);
      }

      for (const header of structure.headers) {
        const range = new vscode.Range(header.line, 0, header.line, 0);
        logger.info(`[HeaderCodeLens] Processing header "${header.title}" at line ${header.line}, level ${header.level}, hasContent: ${header.hasContent}`);

        // Level adjustment commands removed - handled by MermaidCodeLensProvider

        // Navigation commands  
        const headerIndex = structure.headers.indexOf(header);

        if (headerIndex > 0) {
          logger.info(`[HeaderCodeLens] Adding "Move Up" for header "${header.title}"`);
          codeLenses.push(new vscode.CodeLens(range, {
            title: "$(arrow-up) Up",
            command: 'mdToolbar.header.moveUp',
            arguments: [document.uri, header.line],
            tooltip: 'Move section up'
          }));
        }

        if (headerIndex < structure.headers.length - 1) {
          logger.info(`[HeaderCodeLens] Adding "Move Down" for header "${header.title}"`);
          codeLenses.push(new vscode.CodeLens(range, {
            title: "$(arrow-down) Down",
            command: 'mdToolbar.header.moveDown',
            arguments: [document.uri, header.line],
            tooltip: 'Move section down'
          }));
        }

        // Copy link to section
        logger.info(`[HeaderCodeLens] Adding "Copy Link" for header "${header.title}"`);
        codeLenses.push(new vscode.CodeLens(range, {
          title: "$(link) Copy Link",
          command: 'mdToolbar.header.copyLink',
          arguments: [document.uri, header.line, header.anchor],
          tooltip: 'Copy markdown link to this section'
        }));

        // Copy complete section content
        if (header.hasContent) {
          logger.info(`[HeaderCodeLens] Adding "Copy Section" for header "${header.title}"`);
          codeLenses.push(new vscode.CodeLens(range, {
            title: "$(copy) Copy Section",
            command: 'mdToolbar.header.copySection',
            arguments: [document.uri, header.line],
            tooltip: 'Copy complete section content to clipboard'
          }));
        }

        // Fold/Unfold section (if has content) - rightmost position
        if (header.hasContent) {
          const isFolded = await this.isSectionFolded(document, header.line);
          const foldTitle = isFolded ? "$(unfold) Unfold" : "$(fold) Fold";
          const foldTooltip = isFolded ? "Unfold this section" : "Fold this section";
          
          logger.info(`[HeaderCodeLens] Adding "${foldTitle}" for header "${header.title}" (currently ${isFolded ? 'folded' : 'unfolded'})`);
          codeLenses.push(new vscode.CodeLens(range, {
            title: foldTitle,
            command: 'mdToolbar.header.foldSection',
            arguments: [document.uri, header.line],
            tooltip: foldTooltip
          }));
        }
      }

      // Document-level stats removed to reduce clutter

    } catch (error) {
      logger.error('[HeaderCodeLens] Error providing CodeLenses:', error);
    }

    logger.info(`[HeaderCodeLens] Returning ${codeLenses.length} CodeLens items`);
    if (codeLenses.length > 0) {
      logger.info(`[HeaderCodeLens] CodeLens summary:`, codeLenses.map(cl => ({
        title: cl.command?.title || 'No title',
        command: cl.command?.command || 'No command',
        line: cl.range.start.line
      })));
    }

    return codeLenses;
  }

  // Synchronous structure analysis used by unit tests
  // Returns quick regex-based structure without language service
  private analyzeDocumentStructure(document: vscode.TextDocument): DocumentStructure {
    return this.fallbackAnalyzeDocumentStructure(document);
  }

  // Async structure analysis used by the provider at runtime
  private async analyzeDocumentStructureAsync(document: vscode.TextDocument): Promise<DocumentStructure> {
    const startTime = Date.now();
    
    // Try to get cached result first
    const cachedHeaders = this.cache.getCachedHeaders(document);
    if (cachedHeaders) {
      const cacheTime = Date.now() - startTime;
      logger.info(`[HeaderCodeLens] Using cached headers (${cacheTime}ms): ${cachedHeaders.length} headers`);
      return {
        headers: cachedHeaders,
        totalWords: cachedHeaders.reduce((sum, h) => sum + (h.wordCount || 0), 0),
        totalLines: document.lineCount,
        sectionsCount: cachedHeaders.length
      };
    }

    try {
      logger.info(`[HeaderCodeLens] Using MarkdownLanguageServiceWrapper to analyze document structure`);

      // Use the new language service wrapper for robust header extraction
      let structure = await PerformanceMonitor.withTiming(
        () => this.markdownService.parseDocumentStructure(document),
        'MarkdownLanguageService.parseDocumentStructure',
        100
      );

      // If the language service returns no headers, fall back to internal regex logic
      if (!structure.headers || structure.headers.length === 0) {
        logger.info('[HeaderCodeLens] Language service returned no headers, using fallback parsing');
        structure = this.fallbackAnalyzeDocumentStructure(document);
      }

      // Cache the parsed headers
      const parseTime = Date.now() - startTime;
      this.cache.setCachedHeaders(document, structure.headers, parseTime);

      logger.info(`[HeaderCodeLens] Language service found ${structure.headers.length} headers (${parseTime}ms)`);
      logger.info(`[HeaderCodeLens] Total words: ${structure.totalWords}, Total lines: ${structure.totalLines}`);

      return structure;
    } catch (error) {
      logger.error('[HeaderCodeLens] Error using language service, falling back to regex parsing:', error);

      // Fallback to the original regex-based parsing if language service fails
      const structure = this.fallbackAnalyzeDocumentStructure(document);
      const parseTime = Date.now() - startTime;
      this.cache.setCachedHeaders(document, structure.headers, parseTime);
      return structure;
    }
  }

  private analyzeSectionContent(lines: string[], headerLineIndex: number): { hasContent: boolean; wordCount: number } {
    let wordCount = 0;
    let hasContent = false;
    let i = headerLineIndex + 1;

    // Look for content until next header of same or higher level
    const currentLevel = this.getHeaderLevel(lines[headerLineIndex]);

    while (i < lines.length) {
      const line = lines[i];
      const headerLevel = this.getHeaderLevel(line);

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

  private getHeaderLevel(line: string): number {
    const headerMatch = line.trim().match(/^#{1,6}/);
    return headerMatch ? headerMatch[0].length : 0;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
  }

  /**
   * Public methods for header operations (called by commands)
   */
  public async increaseHeaderLevel(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    await this.adjustHeaderLevel(document, lineNumber, 1);
  }

  public async decreaseHeaderLevel(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    await this.adjustHeaderLevel(document, lineNumber, -1);
  }

  private async adjustHeaderLevel(document: vscode.TextDocument, lineNumber: number, adjustment: number): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

    const line = document.lineAt(lineNumber);
    const headerMatch = line.text.trim().match(/^(#{1,6})\s+(.+)$/);

    if (!headerMatch) {
      logger.warn('No header found at line', lineNumber);
      return;
    }

    const currentLevel = headerMatch[1].length;
    const newLevel = Math.max(1, Math.min(6, currentLevel + adjustment));
    const title = headerMatch[2];

    if (newLevel === currentLevel) {
      return; // No change needed
    }

    const newHeader = '#'.repeat(newLevel) + ' ' + title;

    await editor.edit(editBuilder => {
      editBuilder.replace(line.range, newHeader);
    });
  }

  public async insertTOC(document: vscode.TextDocument, afterLineNumber: number): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

  const structure = await this.analyzeDocumentStructureAsync(document);
    const tocLines = ['', '## Table of Contents', ''];

    // Generate TOC entries
    for (const header of structure.headers) {
      if (header.level > 1) { // Skip H1 since we're inserting TOC after H1
        const indent = '  '.repeat(header.level - 2);
        const link = `[${header.title}](#${header.anchor})`;
        tocLines.push(`${indent}- ${link}`);
      }
    }

    tocLines.push(''); // Empty line after TOC

    const insertPosition = new vscode.Position(afterLineNumber + 1, 0);

    await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, tocLines.join('\n'));
    });
  }

  public async moveHeaderUp(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    await this.moveSection(document, lineNumber, -1);
  }

  public async moveHeaderDown(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    await this.moveSection(document, lineNumber, 1);
  }

  private async moveSection(document: vscode.TextDocument, headerLineNumber: number, direction: -1 | 1): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

  const structure = await this.analyzeDocumentStructureAsync(document);
    const currentHeader = structure.headers.find((h: HeaderInfo) => h.line === headerLineNumber);

    if (!currentHeader) {
      return;
    }

    const currentIndex = structure.headers.indexOf(currentHeader);
    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= structure.headers.length) {
      return; // Can't move beyond boundaries
    }

    const targetHeader = structure.headers[targetIndex];
    const lines = document.getText().split('\n');

    // Get section content
    const sectionStart = currentHeader.line;
    const nextHeaderIndex = structure.headers.findIndex((h: HeaderInfo, i: number) => i > currentIndex && h.level <= currentHeader.level);
    const sectionEnd = nextHeaderIndex >= 0 ? structure.headers[nextHeaderIndex].line - 1 : lines.length - 1;

    const sectionLines = lines.slice(sectionStart, sectionEnd + 1);

    // Get target section
    const targetSectionStart = targetHeader.line;
    const targetNextHeaderIndex = structure.headers.findIndex((h: HeaderInfo, i: number) => i > targetIndex && h.level <= targetHeader.level);
    const targetSectionEnd = targetNextHeaderIndex >= 0 ? structure.headers[targetNextHeaderIndex].line - 1 : lines.length - 1;

    // Complex operation - would need careful implementation to avoid conflicts
    // For now, show a message that this is a complex operation
    vscode.window.showInformationMessage(
      `Moving sections is complex. Consider using cut/paste for now. Section "${currentHeader.title}" would move ${direction > 0 ? 'down' : 'up'}.`
    );
  }

  public async copyHeaderLink(document: vscode.TextDocument, lineNumber: number, anchor: string): Promise<void> {
    const line = document.lineAt(lineNumber);
    const headerMatch = line.text.trim().match(/^#{1,6}\s+(.+)$/);

    if (!headerMatch) {
      return;
    }

    const title = headerMatch[1];
    const markdownLink = `[${title}](#${anchor})`;

    await vscode.env.clipboard.writeText(markdownLink);
    vscode.window.showInformationMessage(`Copied link: ${markdownLink}`);
  }

  public async copyHeaderSection(document: vscode.TextDocument, lineNumber: number): Promise<void> {
  const structure = await this.analyzeDocumentStructureAsync(document);
    const header = structure.headers.find(h => h.line === lineNumber);

    if (!header) {
      return;
    }

    const lines = document.getText().split('\n');
    const currentIndex = structure.headers.indexOf(header);

    // Find section boundaries
    const sectionStart = header.line;
    const nextHeaderIndex = structure.headers.findIndex((h, i) => i > currentIndex && h.level <= header.level);
    const sectionEnd = nextHeaderIndex >= 0 ? structure.headers[nextHeaderIndex].line - 1 : lines.length - 1;

    // Extract section content
    const sectionLines = lines.slice(sectionStart, sectionEnd + 1);
    const sectionContent = sectionLines.join('\n').trim();

    await vscode.env.clipboard.writeText(sectionContent);
    vscode.window.showInformationMessage(`Copied section "${header.title}" (${sectionLines.length} lines)`);
  }

  public async showHeaderStats(document: vscode.TextDocument, lineNumber: number): Promise<void> {
  const structure = await this.analyzeDocumentStructureAsync(document);
    const header = structure.headers.find(h => h.line === lineNumber);

    if (!header) {
      return;
    }

    const message = `
Section: "${header.title}"
Level: H${header.level}
Word Count: ${header.wordCount}
Has Content: ${header.hasContent ? 'Yes' : 'No'}
Anchor: #${header.anchor}
    `.trim();

    vscode.window.showInformationMessage(message);
  }

  public async foldSection(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Check current fold state and toggle
    const isCurrentlyFolded = await this.isSectionFolded(document, lineNumber);
    const command = isCurrentlyFolded ? 'editor.unfold' : 'editor.fold';

    logger.info(`[HeaderCodeLens] Section at line ${lineNumber} is ${isCurrentlyFolded ? 'folded' : 'unfolded'}, executing ${command}`);

    await vscode.commands.executeCommand(command, {
      levels: 1,
      direction: 'down',
      selectionLines: [lineNumber]
    });
  }

  private async isSectionFolded(document: vscode.TextDocument, lineNumber: number): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return false;
    }

    try {
      // Get the folding ranges for the document
      const foldingRanges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
        'vscode.executeFoldingRangeProvider',
        document.uri
      );

      if (!foldingRanges) {
        return false;
      }

      // Check if the line is within a folded range
      for (const range of foldingRanges) {
        if (lineNumber >= range.start && lineNumber <= range.end) {
          // Check if this range is currently collapsed
          const isCollapsed = await this.isFoldingRangeCollapsed(range);
          if (isCollapsed) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.warn(`[HeaderCodeLens] Error checking fold state for line ${lineNumber}:`, error);
      return false;
    }
  }

  private async isFoldingRangeCollapsed(range: vscode.FoldingRange): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }

    try {
      // Use VS Code's internal API to check if a range is collapsed
      // This is a bit of a workaround since VS Code doesn't expose this directly
      const startLine = editor.document.lineAt(range.start);
      const endLine = editor.document.lineAt(range.end);

      // Check if the end line is visible (if it's not visible, the range is collapsed)
      const visibleRanges = editor.visibleRanges;

      for (const visibleRange of visibleRanges) {
        // If the end line of the folding range is within a visible range, it's not collapsed
        if (visibleRange.start.line <= range.end && visibleRange.end.line >= range.end) {
          return false;
        }
      }

      // If we can't determine the state, assume it's not collapsed
      return false;
    } catch (error) {
      logger.warn(`[HeaderCodeLens] Error checking if folding range is collapsed:`, error);
      return false;
    }
  }

  public async deleteSection(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    const structure = await this.analyzeDocumentStructure(document);
    const header = structure.headers.find((h: HeaderInfo) => h.line === lineNumber);

    if (!header) {
      return;
    }

    const response = await vscode.window.showWarningMessage(
      `Delete section "${header.title}" and all its content?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (response !== 'Delete') {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return;
    }

    // Find section boundaries
    const currentIndex = structure.headers.indexOf(header);
    const nextHeaderIndex = structure.headers.findIndex((h: HeaderInfo, i: number) => i > currentIndex && h.level <= header.level);

    const startLine = header.line;
    const endLine = nextHeaderIndex >= 0 ? structure.headers[nextHeaderIndex].line - 1 : document.lineCount - 1;

    const deleteRange = new vscode.Range(startLine, 0, endLine + 1, 0);

    await editor.edit(editBuilder => {
      editBuilder.delete(deleteRange);
    });
  }

  public async showDocumentStats(document: vscode.TextDocument): Promise<void> {
    const structure = await this.analyzeDocumentStructure(document);

    const message = `
Document Statistics:
Total Words: ${structure.totalWords}
Total Lines: ${structure.totalLines}
Sections: ${structure.sectionsCount}
Headers by Level:
${this.getHeaderLevelStats(structure.headers)}
    `.trim();

    vscode.window.showInformationMessage(message);
  }

  private getHeaderLevelStats(headers: HeaderInfo[]): string {
    const levelCounts = headers.reduce((counts, header) => {
      counts[header.level] = (counts[header.level] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    return Object.entries(levelCounts)
      .map(([level, count]) => `  H${level}: ${count}`)
      .join('\n');
  }

  /**
   * Fallback method using regex parsing when language service fails
   */
  private fallbackAnalyzeDocumentStructure(document: vscode.TextDocument): DocumentStructure {
    const text = document.getText();
    const lines = text.split('\n');
    const headers: HeaderInfo[] = [];
    let totalWords = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const anchor = this.createAnchor(title);

        logger.info(`[HeaderCodeLens] Fallback found header level ${level}: "${title}"`);

        // Calculate content for this section
        const sectionInfo = this.analyzeSectionContent(lines, i);

        headers.push({
          level,
          title,
          line: i,
          range: new vscode.Range(i, 0, i, line.length),
          anchor,
          hasContent: sectionInfo.hasContent,
          wordCount: sectionInfo.wordCount
        });

        totalWords += sectionInfo.wordCount;
      } else {
        // Count words in non-header lines
        totalWords += this.countWords(line);
      }
    }

    return {
      headers,
      totalWords,
      totalLines: lines.length,
      sectionsCount: headers.length
    };
  }
}