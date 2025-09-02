/**
 * @moduleName: Context Detector Engine - Markdown Context Analysis
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Regex-based markdown context detection engine for determining formatting state at cursor position
 * @techStack: TypeScript, Regular Expressions
 * @dependency: None (pure logic)
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_ENGINE_006} (Context Detection Logic)
 *   {@link Requirements.REQ_ENGINE_007} (Regex Pattern Matching)
 *   {@link Requirements.REQ_ENGINE_008} (Position Analysis)
 * @briefDescription: Analyzes markdown text around cursor position to determine current formatting context. Uses sophisticated regex patterns to detect bold, italic, code, link, and list formatting states, enabling smart toggle behavior in the UI
 * @methods: detectContext, detectBoldContext, detectItalicContext, detectCodeContext, detectLinkContext, detectListContext
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Cursor in "**bold**": Returns { isBold: true, boldRange: {start: 0, end: 7} }
 *   - Cursor in "[link](url)": Returns { isLink: true, linkText: "link", linkUrl: "url" }
 *   - Cursor in "- list item": Returns { isList: true, listType: "bullet" }
 * @vulnerabilitiesAssessment: Regex pattern validation, input boundary checking, no external dependencies, pure function design
 */

/**
 * Context information for markdown formatting at cursor position
 */
export interface IMarkdownContext {
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
  isLink: boolean;
  isList: boolean;
  boldRange?: { start: number; end: number };
  italicRange?: { start: number; end: number };
  codeRange?: { start: number; end: number };
  linkRange?: { start: number; end: number };
  linkText?: string;
  linkUrl?: string;
  listType?: 'bullet' | 'numbered' | 'none';
}

/**
 * Detects markdown formatting context at cursor position
 */
export class ContextDetector {
  
  /**
   * Detects formatting context at the given position
   * @param text Full text content
   * @param position Cursor position
   * @param selectionEnd Optional selection end position
   * @returns Context information
   */
  public detectContext(text: string, position: number, selectionEnd?: number): IMarkdownContext {
    const context: IMarkdownContext = {
      isBold: false,
      isItalic: false,
      isCode: false,
      isLink: false,
      isList: false
    };

    const endPos = selectionEnd ?? position;
    
    // Detect bold formatting
    this.detectBoldContext(text, position, endPos, context);
    
    // Detect italic formatting
    this.detectItalicContext(text, position, endPos, context);
    
    // Detect code formatting
    this.detectCodeContext(text, position, endPos, context);
    
    // Detect link formatting
    this.detectLinkContext(text, position, endPos, context);
    
    // Detect list formatting
    this.detectListContext(text, position, context);

    return context;
  }

  /**
   * Detects bold formatting context
   */
  private detectBoldContext(text: string, start: number, end: number, context: IMarkdownContext): void {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      // Check if cursor/selection overlaps with bold text
      if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
        context.isBold = true;
        context.boldRange = { start: matchStart, end: matchEnd };
        break;
      }
    }
  }

  /**
   * Detects italic formatting context
   */
  private detectItalicContext(text: string, start: number, end: number, context: IMarkdownContext): void {
    // Match both * and _ italic patterns, but avoid bold (**) patterns
    const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|_([^_]+)_/g;
    let match;
    
    while ((match = italicRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
        context.isItalic = true;
        context.italicRange = { start: matchStart, end: matchEnd };
        break;
      }
    }
  }

  /**
   * Detects code formatting context
   */
  private detectCodeContext(text: string, start: number, end: number, context: IMarkdownContext): void {
    const codeRegex = /`([^`]+)`/g;
    let match;
    
    while ((match = codeRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
        context.isCode = true;
        context.codeRange = { start: matchStart, end: matchEnd };
        break;
      }
    }
  }

  /**
   * Detects link formatting context
   */
  private detectLinkContext(text: string, start: number, end: number, context: IMarkdownContext): void {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
        context.isLink = true;
        context.linkRange = { start: matchStart, end: matchEnd };
        context.linkText = match[1];
        context.linkUrl = match[2];
        break;
      }
    }
  }

  /**
   * Detects list formatting context
   */
  private detectListContext(text: string, position: number, context: IMarkdownContext): void {
    const lines = text.split('\n');
    let charCount = 0;
    
    for (const line of lines) {
      const lineEnd = charCount + line.length;
      
      if (position >= charCount && position <= lineEnd) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('+ ')) {
          context.isList = true;
          context.listType = 'bullet';
        } else if (/^\d+\.\s/.test(trimmedLine)) {
          context.isList = true;
          context.listType = 'numbered';
        } else {
          context.listType = 'none';
        }
        break;
      }
      
      charCount = lineEnd + 1; // +1 for newline character
    }
  }

  /**
   * Checks if two ranges overlap
   */
  private rangesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Gets the line containing the given position
   */
  public getLineAt(text: string, position: number): { text: string; start: number; end: number } {
    const lines = text.split('\n');
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineEnd = charCount + line.length;
      
      if (position >= charCount && position <= lineEnd) {
        return {
          text: line,
          start: charCount,
          end: lineEnd
        };
      }
      
      charCount = lineEnd + 1; // +1 for newline character
    }
    
    // Return last line if position is beyond text
    const lastLine = lines[lines.length - 1];
    return {
      text: lastLine,
      start: charCount - lastLine.length - 1,
      end: charCount - 1
    };
  }

  /**
   * Detect document-level context for VS Code document
   */
  public async detectDocumentContext(document: any): Promise<any> {
    const text = document.getText();
    const selection = require('vscode').window.activeTextEditor?.selection;
    const position = require('vscode').window.activeTextEditor?.selection?.active;
    
    // Basic document stats
    const lines = text.split('\n');
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    // Detect document features
    const hasHeaders = /^#+\s/.test(text);
    const hasTables = /^\|.*\|$/m.test(text);
    const hasTaskLists = /^\s*-\s+\[[ x]\]/.test(text);
    const hasCodeBlocks = /```/.test(text);
    const hasLinks = /\[.*\]\(.*\)/.test(text);
    const hasImages = /!\[.*\]\(.*\)/.test(text);
    
    // Selection context
    const hasSelection = selection && !selection.isEmpty;
    const selectionText = hasSelection ? document.getText(selection) : '';
    
    // Position context
    const cursorLine = position ? position.line : 0;
    const currentLineText = lines[cursorLine] || '';
    
    // Context detection at cursor
    const inTable = /^\|.*\|$/.test(currentLineText.trim());
    const inTaskList = /^\s*-\s+\[[ x]\]/.test(currentLineText);
    const inCodeBlock = this.isInCodeBlock(text, position ? document.offsetAt(position) : 0);
    const inList = /^\s*[-*+]\s/.test(currentLineText);
    
    return {
      hasSelection,
      selectionText,
      cursorLine,
      totalLines: lines.length,
      inTable,
      inTaskList,
      inCodeBlock,
      inList,
      documentInfo: {
        wordCount,
        charCount: text.length,
        lineCount: lines.length,
        hasHeaders,
        hasTables,
        hasTaskLists,
        hasCodeBlocks,
        hasLinks,
        hasImages,
        lastModified: Date.now()
      }
    };
  }

  /**
   * Check if position is inside a code block
   */
  private isInCodeBlock(text: string, position: number): boolean {
    const beforeText = text.substring(0, position);
    const codeBlockMatches = beforeText.match(/```/g);
    return codeBlockMatches ? codeBlockMatches.length % 2 === 1 : false;
  }
}
