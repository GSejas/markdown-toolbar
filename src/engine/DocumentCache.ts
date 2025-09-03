/**
 * @moduleName: Document Cache - Performance-Optimized Markdown Parsing Cache
 * @version: 1.0.0
 * @since: 2025-09-03
 * @lastUpdated: 2025-09-03
 * @projectSummary: LRU cache for markdown document parsing results to improve performance
 * @techStack: TypeScript, VS Code API, quick-lru
 * @dependency: vscode, quick-lru
 * @interModuleDependency: ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PERF_001} (Document Parsing Performance)
 *   {@link Requirements.REQ_CACHE_001} (Version-Based Cache Invalidation)
 * @briefDescription: Implements version-based document caching using quick-lru to avoid redundant markdown parsing operations
 * @methods: getCachedHeaders, setCachedHeaders, invalidateDocument, getCacheStats
 * @contributors: VS Code Extension Team
 * @examples:
 *   const cache = DocumentCache.getInstance();
 *   const headers = cache.getCachedHeaders(document) || parseHeaders(document);
 * @vulnerabilitiesAssessment: Memory bounds via LRU, no sensitive data cached
 */

import QuickLRU from 'quick-lru';
import * as vscode from 'vscode';
import { logger } from '../services/Logger';
import { singletonService } from '../di/ServiceContainer';

interface CachedDocument {
  version: number;
  headers: any[];
  lastParsed: Date;
  parseTime: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

@singletonService()
export class DocumentCache {
  private cache = new QuickLRU<string, CachedDocument>({ maxSize: 50 });
  private stats = { hits: 0, misses: 0 };
  private disposables: vscode.Disposable[] = [];

  constructor() {
    // Listen for document changes to invalidate cache
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this),
      vscode.workspace.onDidCloseTextDocument(this.onDocumentClosed, this)
    );
    logger.info('DocumentCache initialized with maxSize: 50');
  }

  getCachedHeaders(document: vscode.TextDocument): any[] | null {
    const key = this.getCacheKey(document);
    const cached = this.cache.get(key);

    if (cached && cached.version === document.version) {
      this.stats.hits++;
      logger.debug(`Cache hit for document: ${document.uri.fsPath}`);
      return cached.headers;
    }

    this.stats.misses++;
    logger.debug(`Cache miss for document: ${document.uri.fsPath}`);
    return null;
  }

  setCachedHeaders(document: vscode.TextDocument, headers: any[], parseTime: number): void {
    const key = this.getCacheKey(document);
    this.cache.set(key, {
      version: document.version,
      headers,
      lastParsed: new Date(),
      parseTime
    });
    logger.debug(`Cached headers for document: ${document.uri.fsPath} (parseTime: ${parseTime}ms)`);
  }

  invalidateDocument(uri: vscode.Uri): void {
    const baseKey = uri.toString();
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(baseKey)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.debug(`Invalidated ${deletedCount} cache entries for: ${uri.fsPath}`);
    }
  }

  getCacheStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: 50,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('Document cache cleared');
  }

  private getCacheKey(document: vscode.TextDocument): string {
    return `${document.uri.toString()}-v${document.version}`;
  }

  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    // Only invalidate if the document is markdown
    if (event.document.languageId === 'markdown') {
      this.invalidateDocument(event.document.uri);
    }
  }

  private onDocumentClosed(document: vscode.TextDocument): void {
    if (document.languageId === 'markdown') {
      this.invalidateDocument(document.uri);
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.clearCache();
    logger.info('DocumentCache disposed');
  }
}