/**
 * @moduleName: Context Service - Document and UI Context Management
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive document and UI context analysis service for markdown editing environment
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../engine/ContextDetector, ../types/Context, ../constants/configKeys
 * @requirementsTraceability:
 *   {@link Requirements.REQ_CONTEXT_001} (Document Analysis)
 *   {@link Requirements.REQ_CONTEXT_002} (UI State Management)
 *   {@link Requirements.REQ_CONTEXT_003} (Context Detection)
 *   {@link Requirements.REQ_CONTEXT_004} (Performance Optimization)
 * @briefDescription: Provides comprehensive context analysis for markdown documents and UI state management. Analyzes document structure, cursor position, and editing context to inform smart formatting decisions and UI updates
 * @methods: analyzeDocument, getCursorContext, updateUIContext, detectDocumentFeatures, getDocumentStats
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Document analysis: Detect tables, task lists, code blocks in current document
 *   - Cursor context: Determine if cursor is in list, table, or code block
 *   - UI updates: Provide context for status bar button states
 * @vulnerabilitiesAssessment: Input validation, VS Code API sandboxing, performance monitoring, error boundary handling
 */

import { ContextDetector } from '../engine/ContextDetector';
import { IMarkdownContext } from '../types/Context';
import { CONFIG_KEYS } from '../constants/configKeys';

/**
 * Document-level context information
 */
export interface IDocumentContext {
  hasSelection: boolean;
  selectionText: string;
  cursorLine: number;
  totalLines: number;
  inTable: boolean;
  inTaskList: boolean;
  inCodeBlock: boolean;
  inList: boolean;
  documentInfo: {
    wordCount: number;
    charCount: number;
    lineCount: number;
    hasHeaders: boolean;
    hasTables: boolean;
    hasTaskLists: boolean;
    hasCodeBlocks: boolean;
    hasLinks: boolean;
    hasImages: boolean;
    lastModified: number;
  };
}

/**
 * Context detector interface
 */
export interface IContextDetector {
  detectDocumentContext(document: any): Promise<IDocumentContext>;
}

/**
 * Configuration for context service
 */
export interface IContextServiceConfig {
  debounceTimeout?: number;
  cacheTimeout?: number;
  enableCaching?: boolean;
}

/**
 * Context change event
 */
export interface IContextChangeEvent {
  previousContext: IDocumentContext | null;
  currentContext: IDocumentContext;
  changedProperties: (keyof IDocumentContext)[];
  timestamp: number;
}

/**
 * Enhanced context service with caching and debouncing
 */
export class ContextService {
  private vscode: any;
  private contextDetector: IContextDetector;
  private config: Required<IContextServiceConfig>;
  private cachedContext: IDocumentContext | null = null;
  private cacheTimestamp = 0;
  private changeCallbacks: Array<(event: IContextChangeEvent) => void> = [];
  private disposables: Array<{ dispose(): void }> = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastDocument: any = null;

  constructor(
    vscodeImpl?: any,
    contextDetector?: IContextDetector,
    config: IContextServiceConfig = {}
  ) {
    this.vscode = vscodeImpl || require('vscode');
    this.contextDetector = contextDetector!; // Required dependency
    this.config = {
      debounceTimeout: config.debounceTimeout || 100,
      cacheTimeout: config.cacheTimeout || 1000, // 1 second cache
      enableCaching: config.enableCaching !== false,
      ...config
    };

    this.initialize();
  }

  /**
   * Get current document context with caching
   */
  public async getCurrentContext(): Promise<IDocumentContext | null> {
    const activeEditor = this.vscode.window.activeTextEditor;

    if (!activeEditor || activeEditor.document.languageId !== 'markdown') {
      return null;
    }

    // Check cache validity
    if (this.isCacheValid(activeEditor.document)) {
      return this.cachedContext;
    }

    // Detect fresh context
    try {
      const context = await this.contextDetector.detectDocumentContext(activeEditor.document);

      // Update cache
      if (this.config.enableCaching) {
        this.cachedContext = context;
        this.cacheTimestamp = Date.now();
        this.lastDocument = activeEditor.document;
      }

      return context;
    } catch (error) {
      console.error('Error detecting document context:', error);
      return null;
    }
  }

  /**
   * Force refresh of context (bypass cache)
   */
  public async refresh(): Promise<IDocumentContext | null> {
    this.invalidateCache();
    return this.getCurrentContext();
  }

  /**
   * Listen for context change events
   */
  public onDidChangeContext(callback: (event: IContextChangeEvent) => void): { dispose(): void } {
    this.changeCallbacks.push(callback);

    return {
      dispose: () => {
        const index = this.changeCallbacks.indexOf(callback);
        if (index >= 0) {
          this.changeCallbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Invalidate cache and trigger refresh
   */
  public invalidateCache(): void {
    this.cachedContext = null;
    this.cacheTimestamp = 0;
    this.lastDocument = null;
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): {
    isCacheValid: boolean;
    cacheAge: number;
    cacheTimeout: number;
    lastCacheTime: number;
  } {
    const now = Date.now();
    const cacheAge = this.cacheTimestamp > 0 ? now - this.cacheTimestamp : -1;

    return {
      isCacheValid: this.cachedContext !== null && cacheAge < this.config.cacheTimeout,
      cacheAge,
      cacheTimeout: this.config.cacheTimeout,
      lastCacheTime: this.cacheTimestamp
    };
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Dispose all event listeners
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        console.warn('Error disposing context service resource:', error);
      }
    });

    this.disposables = [];
    this.changeCallbacks = [];
    this.invalidateCache();
  }

  /**
   * Initialize event listeners and configuration
   */
  private initialize(): void {
    // Listen for document changes
    const onDidChangeDocument = this.vscode.workspace.onDidChangeTextDocument((event: any) => {
      if (event.document.languageId === 'markdown') {
        this.handleDocumentChange(event);
      }
    });
    this.disposables.push(onDidChangeDocument);

    // Listen for active editor changes
    const onDidChangeActiveEditor = this.vscode.window.onDidChangeActiveTextEditor((editor: any) => {
      if (editor && editor.document.languageId === 'markdown') {
        this.handleEditorChange(editor);
      } else if (!editor) {
        // No active editor - clear context
        this.handleContextChange(null);
      }
    });
    this.disposables.push(onDidChangeActiveEditor);

    // Listen for configuration changes
    const onDidChangeConfiguration = this.vscode.workspace.onDidChangeConfiguration((event: any) => {
      if (event.affectsConfiguration(CONFIG_KEYS.root)) {
        this.handleConfigurationChange();
      }
    });
    this.disposables.push(onDidChangeConfiguration);

    // Initial context detection if there's an active markdown editor
    const activeEditor = this.vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'markdown') {
      this.handleEditorChange(activeEditor);
    }
  }

  /**
   * Handle document content changes with debouncing
   */
  private handleDocumentChange(event: any): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounced refresh
    this.debounceTimer = setTimeout(() => {
      this.debouncedRefresh();
    }, this.config.debounceTimeout);
  }

  /**
   * Handle active editor changes
   */
  private handleEditorChange(editor: any): void {
    // Invalidate cache when switching documents
    this.invalidateCache();

    // Trigger immediate context detection
    this.debouncedRefresh();
  }

  /**
   * Handle configuration changes
   */
  private handleConfigurationChange(): void {
    const config = this.vscode.workspace.getConfiguration(CONFIG_KEYS.root);
    const newDebounceTimeout = config.get('contextUpdateDebounce', this.config.debounceTimeout);

    if (newDebounceTimeout !== this.config.debounceTimeout) {
      this.config.debounceTimeout = newDebounceTimeout;
    }

    // Trigger refresh in case context detection behavior changed
    this.debouncedRefresh();
  }

  /**
   * Debounced context refresh
   */
  private async debouncedRefresh(): Promise<void> {
    try {
      const previousContext = this.cachedContext;
      const currentContext = await this.getCurrentContext();

      // Emit change event if context actually changed
      if (this.hasContextChanged(previousContext, currentContext)) {
        const changedProperties = this.getChangedProperties(previousContext, currentContext);

        const event: IContextChangeEvent = {
          previousContext,
          currentContext: currentContext!,
          changedProperties,
          timestamp: Date.now()
        };

        this.handleContextChange(event);
      }
    } catch (error) {
      console.error('Error in debounced context refresh:', error);
    }
  }

  /**
   * Handle context change event
   */
  private handleContextChange(event: IContextChangeEvent | null): void {
    if (!event) {
      // Clear context scenario
      if (this.cachedContext !== null) {
        const clearEvent: IContextChangeEvent = {
          previousContext: this.cachedContext,
          currentContext: {
            hasSelection: false,
            selectionText: '',
            cursorLine: 0,
            totalLines: 0,
            inTable: false,
            inTaskList: false,
            inCodeBlock: false,
            inList: false,
            documentInfo: {
              wordCount: 0,
              charCount: 0,
              lineCount: 0,
              hasHeaders: false,
              hasTables: false,
              hasTaskLists: false,
              hasCodeBlocks: false,
              hasLinks: false,
              hasImages: false,
              lastModified: Date.now()
            }
          },
          changedProperties: ['hasSelection', 'inTable', 'inTaskList', 'inCodeBlock', 'inList'],
          timestamp: Date.now()
        };

        this.emitContextChange(clearEvent);
        this.invalidateCache();
      }
      return;
    }

    this.emitContextChange(event);
  }

  /**
   * Emit context change to all listeners
   */
  private emitContextChange(event: IContextChangeEvent): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in context change callback:', error);
      }
    });
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(document: any): boolean {
    if (!this.config.enableCaching || !this.cachedContext || !this.lastDocument) {
      return false;
    }

    // Check if same document
    if (this.lastDocument.uri.toString() !== document.uri.toString()) {
      return false;
    }

    // Check cache timeout
    const cacheAge = Date.now() - this.cacheTimestamp;
    if (cacheAge > this.config.cacheTimeout) {
      return false;
    }

    // Check if document version changed (indicates content change)
    if (this.lastDocument.version !== document.version) {
      return false;
    }

    return true;
  }

  /**
   * Check if context has actually changed
   */
  private hasContextChanged(
    previous: IDocumentContext | null,
    current: IDocumentContext | null
  ): boolean {
    if (!previous && !current) return false;
    if (!previous || !current) return true;

    // Compare key properties
    const keys: (keyof IDocumentContext)[] = [
      'hasSelection', 'inTable', 'inTaskList', 'inCodeBlock', 'inList', 'cursorLine'
    ];

    return keys.some(key => previous[key] !== current[key]);
  }

  /**
   * Get list of changed properties
   */
  private getChangedProperties(
    previous: IDocumentContext | null,
    current: IDocumentContext | null
  ): (keyof IDocumentContext)[] {
    if (!previous || !current) {
      return ['hasSelection', 'inTable', 'inTaskList', 'inCodeBlock', 'inList'];
    }

    const changed: (keyof IDocumentContext)[] = [];
    const keys: (keyof IDocumentContext)[] = [
      'hasSelection', 'selectionText', 'cursorLine', 'totalLines',
      'inTable', 'inTaskList', 'inCodeBlock', 'inList'
    ];

    keys.forEach(key => {
      if (previous[key] !== current[key]) {
        changed.push(key);
      }
    });

    return changed;
  }
}