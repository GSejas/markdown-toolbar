/**
 * @moduleName: Context Types - Document and Cursor Context Type Definitions
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Type definitions for document context analysis and cursor position detection
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_TYPES_007} (Context Detection Types)
 *   {@link Requirements.REQ_TYPES_008} (Document Analysis Types)
 *   {@link Requirements.REQ_TYPES_009} (Cursor Position Types)
 * @briefDescription: Defines TypeScript interfaces for markdown document context analysis including cursor position, formatting detection, and document structure information
 * @methods: Type definitions and interfaces only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - IMarkdownContext: Formatting state at cursor position
 *   - IDocumentContext: Overall document structure and features
 *   - Range information for precise text manipulation
 * @vulnerabilitiesAssessment: Type safety validation, compile-time error detection, no runtime security concerns
 */

/**
 * Context detection interfaces and types
 */

/**
 * Context information for markdown formatting at cursor position
 * Extends the existing IMarkdownContext with new context types
 */
export interface IMarkdownContext {
  // Existing context types
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
  isLink: boolean;
  isList: boolean;
  
  // New context types
  isStrikethrough: boolean;
  isInCodeBlock: boolean;
  inTable: boolean;
  onTaskLine: boolean;
  
  // Range information
  boldRange?: { start: number; end: number };
  italicRange?: { start: number; end: number };
  codeRange?: { start: number; end: number };
  strikethroughRange?: { start: number; end: number };
  codeBlockRange?: { start: number; end: number };
  linkRange?: { start: number; end: number };
  tableRange?: { start: number; end: number };
  taskRange?: { start: number; end: number };
  
  // Content extraction
  linkText?: string;
  linkUrl?: string;
  listType?: 'bullet' | 'numbered' | 'none';
  taskState?: 'incomplete' | 'complete';
  codeBlockLanguage?: string;
  
  // Table context
  tableContext?: ITableContext;
}

/**
 * Detailed table context information
 */
export interface ITableContext {
  inTable: boolean;
  tableRange?: { start: number; end: number };
  currentRow?: number;
  currentColumn?: number;
  columnCount?: number;
  rowCount?: number;
  isHeaderRow?: boolean;
  columnAlignment?: ('left' | 'center' | 'right')[];
}

/**
 * Task line context information
 */
export interface ITaskContext {
  onTaskLine: boolean;
  taskState?: 'incomplete' | 'complete';
  taskRange?: { start: number; end: number };
  taskText?: string;
  indentLevel?: number;
}

/**
 * Context detection result with location information
 */
export interface IContextDetectionResult {
  context: IMarkdownContext;
  position: number;
  selectionEnd?: number;
  timestamp: number; // For caching and performance
}

/**
 * Context service interface for dependency injection
 */
export interface IContextService {
  detectContext(text: string, position: number, selectionEnd?: number): IMarkdownContext;
  detectTableContext(text: string, position: number): ITableContext;
  detectTaskContext(text: string, position: number): ITaskContext;
  isInTable(text: string, position: number): boolean;
  isOnTaskLine(text: string, position: number): boolean;
}

/**
 * Context update event for reactive UI updates
 */
export interface IContextUpdateEvent {
  context: IMarkdownContext;
  previousContext?: IMarkdownContext;
  changedProperties: (keyof IMarkdownContext)[];
  timestamp: number;
}