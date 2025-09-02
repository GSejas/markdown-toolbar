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

export class HeaderCodeLensProvider implements vscode.CodeLensProvider {
  private contextDetector = new ContextDetector();

  constructor() {
    logger.info('HeaderCodeLensProvider initialized');
  }

  async provideCodeLenses(
    document: vscode.TextDocument, 
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (token.isCancellationRequested || document.languageId !== 'markdown') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];
    
    try {
      const structure = this.analyzeDocumentStructure(document);
      
      for (const header of structure.headers) {
        const range = new vscode.Range(header.line, 0, header.line, 0);
        
        // Level adjustment commands
        if (header.level > 1) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "H+",
            command: 'mdToolbar.header.increaseLevel',
            arguments: [document.uri, header.line],
            tooltip: 'Increase header level (make smaller)'
          }));
        }
        
        if (header.level < 6) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "H-",
            command: 'mdToolbar.header.decreaseLevel', 
            arguments: [document.uri, header.line],
            tooltip: 'Decrease header level (make larger)'
          }));
        }

        // TOC operations (only for top-level headers)
        if (header.level === 1) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "📋 Insert TOC",
            command: 'mdToolbar.header.insertTOC',
            arguments: [document.uri, header.line],
            tooltip: 'Insert table of contents after this header'
          }));
        }

        // Navigation commands
        const headerIndex = structure.headers.indexOf(header);
        
        if (headerIndex > 0) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "⬆️ Move Up",
            command: 'mdToolbar.header.moveUp',
            arguments: [document.uri, header.line],
            tooltip: 'Move section up'
          }));
        }
        
        if (headerIndex < structure.headers.length - 1) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "⬇️ Move Down", 
            command: 'mdToolbar.header.moveDown',
            arguments: [document.uri, header.line],
            tooltip: 'Move section down'
          }));
        }

        // Section management
        if (header.hasContent) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: `📊 ${header.wordCount} words`,
            command: 'mdToolbar.header.showStats',
            arguments: [document.uri, header.line],
            tooltip: 'Show section statistics'
          }));
        }

        // Copy link to section
        codeLenses.push(new vscode.CodeLens(range, {
          title: "🔗 Copy Link",
          command: 'mdToolbar.header.copyLink',
          arguments: [document.uri, header.line, header.anchor],
          tooltip: 'Copy markdown link to this section'
        }));

        // Fold section (if has content)
        if (header.hasContent) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "📁 Fold",
            command: 'mdToolbar.header.foldSection',
            arguments: [document.uri, header.line],
            tooltip: 'Fold this section'
          }));
        }

        // Delete section (with confirmation)
        if (header.hasContent || structure.headers.length > 1) {
          codeLenses.push(new vscode.CodeLens(range, {
            title: "🗑️ Delete",
            command: 'mdToolbar.header.deleteSection',
            arguments: [document.uri, header.line],
            tooltip: 'Delete this section (with confirmation)'
          }));
        }
      }

      // Document-level commands on first header
      if (structure.headers.length > 0) {
        const firstHeader = structure.headers[0];
        const range = new vscode.Range(firstHeader.line, 0, firstHeader.line, 0);
        
        codeLenses.push(new vscode.CodeLens(range, {
          title: `📄 ${structure.totalWords} words, ${structure.sectionsCount} sections`,
          command: 'mdToolbar.document.showStats',
          arguments: [document.uri],
          tooltip: 'Show document statistics'
        }));
      }

    } catch (error) {
      logger.error('Error providing header CodeLenses:', error);
    }

    return codeLenses;
  }

  private analyzeDocumentStructure(document: vscode.TextDocument): DocumentStructure {
    const text = document.getText();
    const lines = text.split('\n');
    const headers: HeaderInfo[] = [];
    let totalWords = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const anchor = this.createAnchor(title);
        
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
    const headerMatch = line.match(/^#{1,6}/);
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
    const headerMatch = line.text.match(/^(#{1,6})\s+(.+)$/);
    
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

    const structure = this.analyzeDocumentStructure(document);
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

    const structure = this.analyzeDocumentStructure(document);
    const currentHeader = structure.headers.find(h => h.line === headerLineNumber);
    
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
    const nextHeaderIndex = structure.headers.findIndex((h, i) => i > currentIndex && h.level <= currentHeader.level);
    const sectionEnd = nextHeaderIndex >= 0 ? structure.headers[nextHeaderIndex].line - 1 : lines.length - 1;
    
    const sectionLines = lines.slice(sectionStart, sectionEnd + 1);
    
    // Get target section
    const targetSectionStart = targetHeader.line;
    const targetNextHeaderIndex = structure.headers.findIndex((h, i) => i > targetIndex && h.level <= targetHeader.level);
    const targetSectionEnd = targetNextHeaderIndex >= 0 ? structure.headers[targetNextHeaderIndex].line - 1 : lines.length - 1;
    
    // Complex operation - would need careful implementation to avoid conflicts
    // For now, show a message that this is a complex operation
    vscode.window.showInformationMessage(
      `Moving sections is complex. Consider using cut/paste for now. Section "${currentHeader.title}" would move ${direction > 0 ? 'down' : 'up'}.`
    );
  }

  public async copyHeaderLink(document: vscode.TextDocument, lineNumber: number, anchor: string): Promise<void> {
    const line = document.lineAt(lineNumber);
    const headerMatch = line.text.match(/^#{1,6}\s+(.+)$/);
    
    if (!headerMatch) {
      return;
    }

    const title = headerMatch[1];
    const markdownLink = `[${title}](#${anchor})`;
    
    await vscode.env.clipboard.writeText(markdownLink);
    vscode.window.showInformationMessage(`Copied link: ${markdownLink}`);
  }

  public async showHeaderStats(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    const structure = this.analyzeDocumentStructure(document);
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

    // Use VS Code's built-in folding
    await vscode.commands.executeCommand('editor.fold', {
      levels: 1,
      direction: 'down',
      selectionLines: [lineNumber]
    });
  }

  public async deleteSection(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    const structure = this.analyzeDocumentStructure(document);
    const header = structure.headers.find(h => h.line === lineNumber);
    
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
    const nextHeaderIndex = structure.headers.findIndex((h, i) => i > currentIndex && h.level <= header.level);
    
    const startLine = header.line;
    const endLine = nextHeaderIndex >= 0 ? structure.headers[nextHeaderIndex].line - 1 : document.lineCount - 1;
    
    const deleteRange = new vscode.Range(startLine, 0, endLine + 1, 0);
    
    await editor.edit(editBuilder => {
      editBuilder.delete(deleteRange);
    });
  }

  public async showDocumentStats(document: vscode.TextDocument): Promise<void> {
    const structure = this.analyzeDocumentStructure(document);
    
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
}