/**
 * @moduleName: Performance Monitor - Extension Performance Tracking
 * @version: 1.0.0
 * @since: 2025-09-03
 * @lastUpdated: 2025-09-03
 * @projectSummary: Performance monitoring utilities for tracking operation timing and memory usage
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: ../services/Logger, ../engine/DocumentCache
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PERF_001} (Performance Monitoring)
 *   {@link Requirements.REQ_PERF_002} (Performance Diagnostics)
 * @briefDescription: Provides performance instrumentation for critical operations with timing hooks and diagnostics
 * @methods: withTiming, trackMemory, getPerformanceStats, createDiagnosticsCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   const result = await withTiming(operation, 'OperationName');
 *   const stats = PerformanceMonitor.getStats();
 * @vulnerabilitiesAssessment: No sensitive data in performance logs, memory usage tracking
 */

import * as vscode from 'vscode';
import { logger } from '../services/Logger';
import { DocumentCache } from '../engine/DocumentCache';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: Date;
}

interface PerformanceStats {
  operations: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
  }>;
  memory: {
    current: MemoryUsage;
    peak: MemoryUsage;
    samples: MemoryUsage[];
  };
  cache: any;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static memorySnapshots: MemoryUsage[] = [];
  private static maxMetrics = 1000;
  private static maxMemorySnapshots = 100;
  private static isMemoryTrackingEnabled = false;

  static withTiming<T>(
    operation: () => Promise<T>,
    operationName: string,
    logThreshold: number = 100
  ): Promise<T> {
    return this.withTimingInternal(operation, operationName, logThreshold);
  }

  static withSyncTiming<T>(
    operation: () => T,
    operationName: string,
    logThreshold: number = 50
  ): T {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operationName, duration, true);
      
      if (duration > logThreshold) {
        logger.warn(`Slow operation: ${operationName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operationName, duration, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private static async withTimingInternal<T>(
    operation: () => Promise<T>,
    operationName: string,
    logThreshold: number
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operationName, duration, true);

      if (duration > logThreshold) {
        logger.warn(`Slow async operation: ${operationName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operationName, duration, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  static startMemoryTracking(): void {
    if (this.isMemoryTrackingEnabled) {
      return;
    }

    this.isMemoryTrackingEnabled = true;
    
    // Track memory every 30 seconds
    const memoryTracker = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);

    // Clean up on extension deactivation (would need to be registered in extension.ts)
    logger.info('Performance monitoring: Memory tracking started');
  }

  static stopMemoryTracking(): void {
    this.isMemoryTrackingEnabled = false;
    logger.info('Performance monitoring: Memory tracking stopped');
  }

  private static recordMetric(name: string, duration: number, success: boolean, error?: string): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      success,
      error
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private static recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const snapshot: MemoryUsage = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      timestamp: new Date()
    };

    this.memorySnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.memorySnapshots.length > this.maxMemorySnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.maxMemorySnapshots);
    }
  }

  static getPerformanceStats(): PerformanceStats {
    const operations: Record<string, any> = {};
    
    // Aggregate metrics by operation name
    for (const metric of this.metrics) {
      if (!operations[metric.name]) {
        operations[metric.name] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          successCount: 0
        };
      }
      
      const op = operations[metric.name];
      op.count++;
      op.totalTime += metric.duration;
      op.minTime = Math.min(op.minTime, metric.duration);
      op.maxTime = Math.max(op.maxTime, metric.duration);
      
      if (metric.success) {
        op.successCount++;
      }
    }

    // Calculate derived stats
    for (const opName in operations) {
      const op = operations[opName];
      op.averageTime = Math.round(op.totalTime / op.count);
      op.successRate = Math.round((op.successCount / op.count) * 100);
    }

    // Get current and peak memory usage
    const currentMemory = this.getCurrentMemoryUsage();
    const peakMemory = this.getPeakMemoryUsage();

    return {
      operations,
      memory: {
        current: currentMemory,
        peak: peakMemory,
        samples: this.memorySnapshots.slice(-10) // Last 10 samples
      },
      cache: this.getCacheStats()
    };
  }

  private static getCurrentMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      timestamp: new Date()
    };
  }

  private static getPeakMemoryUsage(): MemoryUsage {
    if (this.memorySnapshots.length === 0) {
      return this.getCurrentMemoryUsage();
    }

    return this.memorySnapshots.reduce((peak, current) => 
      current.heapUsed > peak.heapUsed ? current : peak
    );
  }

  private static getCacheStats(): any {
    try {
      // This would need to be updated to work with DI when implemented
      const cache = new DocumentCache(); // Temporary - would use DI in real implementation
      return cache.getCacheStats();
    } catch (error) {
      return { error: 'Cache stats unavailable' };
    }
  }

  static createPerformanceDiagnosticsCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('mdToolbar.performance.diagnostics', () => {
      this.showPerformanceDiagnostics();
    });
  }

  private static showPerformanceDiagnostics(): void {
    const stats = this.getPerformanceStats();
    
    const report = this.generatePerformanceReport(stats);
    
    // Show in new untitled document
    vscode.workspace.openTextDocument({
      content: report,
      language: 'markdown'
    }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  private static generatePerformanceReport(stats: PerformanceStats): string {
    let report = '# Markdown Toolbar Performance Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Memory usage
    report += '## Memory Usage\n\n';
    report += `- **Current Heap Used**: ${(stats.memory.current.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Current Heap Total**: ${(stats.memory.current.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Peak Heap Used**: ${(stats.memory.peak.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    // Cache statistics
    report += '## Cache Performance\n\n';
    if (stats.cache.error) {
      report += `- Cache stats unavailable: ${stats.cache.error}\n\n`;
    } else {
      report += `- **Hit Rate**: ${stats.cache.hitRate.toFixed(1)}%\n`;
      report += `- **Cache Hits**: ${stats.cache.hits}\n`;
      report += `- **Cache Misses**: ${stats.cache.misses}\n`;
      report += `- **Cache Size**: ${stats.cache.size}/${stats.cache.maxSize}\n\n`;
    }
    
    // Operation statistics
    report += '## Operation Performance\n\n';
    report += '| Operation | Count | Avg Time | Min | Max | Success Rate |\n';
    report += '|-----------|-------|----------|-----|-----|---------------|\n';
    
    for (const [name, op] of Object.entries(stats.operations)) {
      report += `| ${name} | ${op.count} | ${op.averageTime}ms | ${op.minTime}ms | ${op.maxTime}ms | ${op.successRate}% |\n`;
    }
    
    return report;
  }

  static clearMetrics(): void {
    this.metrics = [];
    this.memorySnapshots = [];
    logger.info('Performance metrics cleared');
  }
}