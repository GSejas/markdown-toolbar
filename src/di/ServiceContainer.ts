/**
 * @moduleName: Service Container - Simplified Dependency Injection
 * @version: 1.0.0
 * @since: 2025-09-03
 * @lastUpdated: 2025-09-03
 * @projectSummary: Lightweight dependency injection container using tsyringe
 * @techStack: TypeScript, tsyringe, reflect-metadata
 * @dependency: tsyringe, reflect-metadata
 * @interModuleDependency: ../services/Logger
 * @requirementsTraceability:
 *   {@link Requirements.REQ_DI_001} (Service Registration)
 *   {@link Requirements.REQ_DI_002} (Singleton Management)
 * @briefDescription: Provides centralized service registration and resolution using tsyringe for cleaner architecture
 * @methods: registerServices, getService, dispose
 * @contributors: VS Code Extension Team
 * @examples:
 *   ServiceContainer.registerServices(context);
 *   const cache = container.resolve(DocumentCache);
 * @vulnerabilitiesAssessment: Service lifecycle management, proper disposal
 */

import 'reflect-metadata';
import { container, injectable, singleton } from 'tsyringe';
import * as vscode from 'vscode';
import { logger } from '../services/Logger';

// Service Tokens for injection
export const TOKENS = {
  VSCODE_CONTEXT: Symbol('VSCodeContext'),
  EXTENSION_CONTEXT: Symbol('ExtensionContext')
} as const;

export class ServiceContainer {
  private static isInitialized = false;
  private static disposables: vscode.Disposable[] = [];

  static initialize(context: vscode.ExtensionContext): void {
    if (this.isInitialized) {
      logger.warn('ServiceContainer already initialized');
      return;
    }

    try {
      // Register extension context
      container.registerInstance(TOKENS.EXTENSION_CONTEXT, context);
      
      // Register core services
      this.registerCoreServices();
      
      this.isInitialized = true;
      logger.info('ServiceContainer initialized successfully');

      // Clean up on extension deactivation
      context.subscriptions.push(
        new vscode.Disposable(() => this.dispose())
      );
    } catch (error) {
      logger.error('Failed to initialize ServiceContainer:', error);
      throw error;
    }
  }

  private static registerCoreServices(): void {
    // Services will auto-register themselves via decorators
    // This method can be used for any manual registrations if needed
    logger.debug('Core services registration completed');
  }

  static getContainer() {
    if (!this.isInitialized) {
      throw new Error('ServiceContainer not initialized. Call initialize() first.');
    }
    return container;
  }

  static resolve<T>(token: any): T {
    if (!this.isInitialized) {
      throw new Error('ServiceContainer not initialized. Call initialize() first.');
    }
    
    try {
      return container.resolve(token);
    } catch (error) {
      logger.error(`Failed to resolve service:`, error);
      throw error;
    }
  }

  static dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Dispose of any registered disposables
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
      
      // Clear container
      container.clearInstances();
      
      this.isInitialized = false;
      logger.info('ServiceContainer disposed');
    } catch (error) {
      logger.error('Error disposing ServiceContainer:', error);
    }
  }

  static isReady(): boolean {
    return this.isInitialized;
  }
}

// Decorator factories for easier service registration
export function service() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    injectable()(constructor);
    return constructor;
  };
}

export function singletonService() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    singleton()(constructor);
    injectable()(constructor);
    return constructor;
  };
}