/**
 * @moduleName: Context Key Manager - VS Code Context Key Service
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Centralized service for managing VS Code context keys with performance optimization and error handling
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../constants/contextKeys
 * @requirementsTraceability:
 *   {@link Requirements.REQ_CONTEXT_005} (Context Key Management)
 *   {@link Requirements.REQ_CONTEXT_006} (Performance Optimization)
 *   {@link Requirements.REQ_CONTEXT_007} (Error Handling)
 * @briefDescription: Manages VS Code context keys used for controlling menu visibility and command availability. Implements performance optimizations by avoiding redundant updates and provides centralized error handling
 * @methods: setContext, getContext, clearContext, dispose
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Performance: Only updates context keys when values actually change
 *   - Error handling: Graceful failure with logging for context key operations
 *   - Centralized: Single service managing all extension context keys
 * @vulnerabilitiesAssessment: VS Code API validation, error boundary handling, resource cleanup, input sanitization
 */

import { IContextKeyManager, ContextKeyValue } from '../constants/contextKeys';
import { logger } from './Logger';

/**
 * Centralized context key management service
 * Follows best practices for VS Code context key management
 */
export class ContextKeyManager implements IContextKeyManager {
  private vscode: any;
  private currentKeys: Map<string, ContextKeyValue> = new Map();

  constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
  }

  /**
   * Set a context key value (only if it actually changed)
   */
  public async setContext(key: string, value: ContextKeyValue): Promise<void> {
    // Avoid redundant updates for performance
    if (this.currentKeys.get(key) === value) {
      return;
    }

    try {
      await this.vscode.commands.executeCommand('setContext', key, value);
      this.currentKeys.set(key, value);
      logger.debug(`Context key set: ${key} = ${String(value)}`);
    } catch (error) {
      logger.warn(`Failed to set context key '${key}' to '${value}':`, error);
      throw error;
    }
  }

  /**
   * Get cached context key value
   * Note: This returns our cached value, not the actual VS Code context
   */
  public getContext(key: string): ContextKeyValue {
    return this.currentKeys.get(key);
  }

  /**
   * Clear a context key (set to undefined)
   */
  public async clearContext(key: string): Promise<void> {
    await this.setContext(key, undefined);
  }

  /**
   * Set multiple context keys in batch
   * More efficient than individual calls
   */
  public async setContexts(contexts: Record<string, ContextKeyValue>): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const [key, value] of Object.entries(contexts)) {
      // Only update if value actually changed
      if (this.currentKeys.get(key) !== value) {
        updates.push(this.setContext(key, value));
      }
    }

    // Execute all updates in parallel
    await Promise.all(updates);
  }

  /**
   * Get all currently set context keys for debugging
   */
  public getAllContexts(): Record<string, ContextKeyValue> {
    return Object.fromEntries(this.currentKeys.entries());
  }

  /**
   * Clear all context keys managed by this instance
   */
  public async clearAll(): Promise<void> {
    const clearPromises = Array.from(this.currentKeys.keys()).map(key =>
      this.clearContext(key)
    );

    await Promise.all(clearPromises);
  }

  /**
   * Dispose and clean up context keys
   */
  public dispose(): void {
    // In VS Code, context keys persist until the window is closed
    // We could clear them, but usually it's not necessary
    this.currentKeys.clear();
  }
}