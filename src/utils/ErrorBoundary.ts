/**
 * @moduleName: Error Boundary - Provider Error Handling and Recovery
 * @version: 1.0.0
 * @since: 2025-09-03
 * @lastUpdated: 2025-09-03
 * @projectSummary: Error boundary utilities for graceful provider failure handling
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_RELIABILITY_001} (Provider Error Recovery)
 *   {@link Requirements.REQ_LOGGING_001} (Error Reporting)
 * @briefDescription: Provides error boundary wrappers for provider methods with fallback values and error reporting
 * @methods: withErrorBoundary, withProviderErrorBoundary, reportError
 * @contributors: VS Code Extension Team
 * @examples:
 *   const result = await withErrorBoundary(riskOperation, fallbackValue, 'ContextName');
 * @vulnerabilitiesAssessment: No sensitive data in error logs, safe fallback patterns
 */

import * as vscode from 'vscode';
import { logger } from '../services/Logger';

interface ErrorBoundaryOptions {
  context: string;
  showErrorToUser?: boolean;
  reportToTelemetry?: boolean;
  timeout?: number;
}

export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback: T,
  options: ErrorBoundaryOptions | string
): Promise<T> {
  const opts: ErrorBoundaryOptions = typeof options === 'string' 
    ? { context: options }
    : options;

  const startTime = Date.now();

  try {
    // Add timeout support if specified
    if (opts.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${opts.timeout}ms`)), opts.timeout);
      });
      
      return await Promise.race([operation(), timeoutPromise]);
    }
    
    return await operation();
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`Error in ${opts.context} (${duration}ms):`, error);

    // Show error to user if requested (for critical failures)
    if (opts.showErrorToUser) {
      vscode.window.showWarningMessage(
        `Markdown extension error in ${opts.context}: ${errorMessage}`,
        'View Log'
      ).then(selection => {
        if (selection === 'View Log') {
          vscode.commands.executeCommand('workbench.action.showLogs');
        }
      });
    }

    // Report to telemetry if available (placeholder for future implementation)
    if (opts.reportToTelemetry) {
      // Could integrate with VS Code telemetry here
      logger.info(`Telemetry: Error reported for ${opts.context}`);
    }

    return fallback;
  }
}

export async function withProviderErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback: T,
  providerName: string
): Promise<T> {
  return withErrorBoundary(operation, fallback, {
    context: `${providerName}.provider`,
    showErrorToUser: false, // Providers should fail silently
    reportToTelemetry: true,
    timeout: 5000 // 5 second timeout for provider operations
  });
}

export function withSyncErrorBoundary<T>(
  operation: () => T,
  fallback: T,
  context: string
): T {
  try {
    return operation();
  } catch (error) {
    logger.error(`Sync error in ${context}:`, error);
    return fallback;
  }
}

export class ProviderErrorTracker {
  private static errorCounts = new Map<string, number>();
  private static readonly MAX_ERRORS = 10;

  static trackError(providerName: string): boolean {
    const current = this.errorCounts.get(providerName) || 0;
    const newCount = current + 1;
    this.errorCounts.set(providerName, newCount);

    if (newCount >= this.MAX_ERRORS) {
      logger.warn(`Provider ${providerName} has exceeded maximum error threshold (${this.MAX_ERRORS})`);
      vscode.window.showWarningMessage(
        `Markdown extension: ${providerName} has been temporarily disabled due to errors.`,
        'Reset', 'View Log'
      ).then(selection => {
        if (selection === 'Reset') {
          this.resetErrors(providerName);
        } else if (selection === 'View Log') {
          vscode.commands.executeCommand('workbench.action.showLogs');
        }
      });
      return false; // Provider should be disabled
    }

    return true; // Provider can continue
  }

  static resetErrors(providerName: string): void {
    this.errorCounts.delete(providerName);
    logger.info(`Error count reset for provider: ${providerName}`);
  }

  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}