/**
 * @moduleName: Dependency Detector - Extension Detection Service
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Intelligent detection and monitoring of VS Code extension dependencies with caching and event handling
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../types/Dependencies, ../constants/contextKeys, ../services/ContextKeyManager
 * @requirementsTraceability:
 *   {@link Requirements.REQ_DEPS_001} (Extension Detection)
 *   {@link Requirements.REQ_DEPS_002} (Dependency State Management)
 *   {@link Requirements.REQ_DEPS_003} (Change Notification)
 *   {@link Requirements.REQ_DEPS_004} (Performance Caching)
 * @briefDescription: Monitors VS Code extension dependencies and provides real-time state updates. Detects extension installation, activation, and availability changes with intelligent caching and event-driven notifications
 * @methods: detectExtension, getDependencyState, onDependencyChange, updateContextKeys, dispose
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Extension detection: Check if 'yzhang.markdown-all-in-one' is installed and active
 *   - State monitoring: Listen for dependency changes and update UI accordingly
 *   - Context integration: Automatically update VS Code context keys based on dependencies
 * @vulnerabilitiesAssessment: VS Code API validation, proper resource disposal, event listener cleanup, cache invalidation
 */

import {
  IDependencyDetector,
  IDependencyState,
  IExtensionInfo,
  IDependencyChangeEvent,
  EXTENSION_IDS
} from '../types/Dependencies';
import { CONTEXT_KEYS } from '../constants/contextKeys';
import { ContextKeyManager } from '../services/ContextKeyManager';

/**
 * Configuration for dependency detection
 */
export interface IDependencyDetectorConfig {
  cacheTimeout?: number;
  autoDetectChanges?: boolean;
}

/**
 * Detects installed VS Code extensions and manages dependency state
 */
export class DependencyDetector implements IDependencyDetector {
  private vscode: any;
  private config: Required<IDependencyDetectorConfig>;
  private cachedState: IDependencyState | null = null;
  private changeCallbacks: Array<(event: IDependencyChangeEvent) => void> = [];
  private disposables: Array<{ dispose(): void }> = [];
  private contextKeyManager: ContextKeyManager;

  constructor(
    vscodeImpl?: any, 
    config: IDependencyDetectorConfig = {},
    contextKeyManager?: ContextKeyManager
  ) {
    this.vscode = vscodeImpl || require('vscode');
    this.config = {
      cacheTimeout: 30000, // 30 seconds default
      autoDetectChanges: true,
      ...config
    };
    
    // Use provided context key manager or create new one
    this.contextKeyManager = contextKeyManager || new ContextKeyManager(vscodeImpl);

    if (this.config.autoDetectChanges) {
      this.startListening();
    }
  }

  /**
   * Get current state of all tracked dependencies
   */
  public getCurrentState(): IDependencyState {
    const now = Date.now();
    
    // Return cached state if still valid
    if (this.cachedState && (now - this.cachedState.lastUpdated) < this.config.cacheTimeout) {
      return this.cachedState;
    }

    // Detect all tracked extensions
    const extensions: Record<string, IExtensionInfo> = {};
    Object.values(EXTENSION_IDS).forEach(extensionId => {
      extensions[extensionId] = this.detectExtension(extensionId);
    });

    // Build dependency state - use isActive for availability
    const state: IDependencyState = {
      hasMAIO: extensions[EXTENSION_IDS.MAIO]?.isActive ?? false,
      hasMarkdownlint: extensions[EXTENSION_IDS.MARKDOWNLINT]?.isActive ?? false,
      hasPasteImage: extensions[EXTENSION_IDS.PASTE_IMAGE]?.isActive ?? false,
      hasMPE: extensions[EXTENSION_IDS.MPE]?.isActive ?? false,
      extensions,
      lastUpdated: now
    };

    // Update context keys
    this.updateContextKeys(state);

    // Cache the state
    this.cachedState = state;

    return state;
  }

  /**
   * Detect a specific extension with proper active/installed/disabled states
   */
  public detectExtension(extensionId: string): IExtensionInfo {
    try {
      const extension = this.vscode.extensions.getExtension(extensionId);
      
      if (!extension) {
        return this.createMissingExtensionInfo(extensionId);
      }

      // Extension exists (is installed)
      const isActive = extension.isActive;
      const isInstalled = true;
      
      // Check if extension is disabled (installed but not active due to user settings)
      // Note: There's no direct API to check if disabled, but we can infer it
      // If extension is installed but not active, it might be disabled or just not activated yet
      const isDisabled = !isActive; // Simplified - in real scenarios this is more complex

      return {
        id: extensionId,
        name: this.extractNameFromId(extensionId),
        displayName: extension.packageJSON?.displayName || extensionId,
        isInstalled,
        isActive,
        isDisabled,
        version: extension.packageJSON?.version,
        commands: this.extractCommands(extension),
        canUseAPI: isActive // Can only use ext.exports if active
      };
    } catch (error) {
      console.warn(`Failed to detect extension ${extensionId}:`, error);
      return this.createMissingExtensionInfo(extensionId);
    }
  }

  /**
   * Check if extension is available for use (installed and active)
   * Use this when you need to delegate commands or access extension APIs
   */
  public isExtensionAvailable(extensionId: string): boolean {
    const info = this.detectExtension(extensionId);
    return info.isInstalled && info.isActive;
  }

  /**
   * Check if extension is just installed (regardless of active state)
   * Use this for showing installation status to users
   */
  public isExtensionInstalled(extensionId: string): boolean {
    const info = this.detectExtension(extensionId);
    return info.isInstalled;
  }

  /**
   * Attempt to activate an extension if it's installed but not active
   * Useful when you need to access the extension's API
   */
  public async ensureExtensionActive(extensionId: string): Promise<boolean> {
    try {
      const extension = this.vscode.extensions.getExtension(extensionId);
      if (!extension) {
        return false; // Not installed
      }

      if (!extension.isActive) {
        await extension.activate();
      }

      return extension.isActive;
    } catch (error) {
      console.warn(`Failed to activate extension ${extensionId}:`, error);
      return false;
    }
  }

  /**
   * Listen for extension state changes
   */
  public onDidChangeExtensions(callback: (event: IDependencyChangeEvent) => void): { dispose(): void } {
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
   * Force refresh of dependency state
   */
  public async refresh(): Promise<IDependencyState> {
    const previousState = this.cachedState;
    
    // Clear cache to force refresh
    this.cachedState = null;
    
    const currentState = this.getCurrentState();
    
    // Emit change events if state actually changed
    if (previousState) {
      this.detectAndEmitChanges(previousState, currentState);
    }
    
    return currentState;
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        console.warn('Error disposing dependency detector resource:', error);
      }
    });
    this.disposables = [];
    this.changeCallbacks = [];
    this.cachedState = null;
    
    // Clean up context key manager
    this.contextKeyManager.dispose();
  }

  /**
   * Start listening for VS Code extension changes
   */
  private startListening(): void {
    if (!this.vscode.extensions?.onDidChange) {
      console.warn('VS Code extensions.onDidChange not available');
      return;
    }

    const disposable = this.vscode.extensions.onDidChange(() => {
      this.handleExtensionChange();
    });

    this.disposables.push(disposable);
  }

  /**
   * Handle VS Code extension change event
   */
  private async handleExtensionChange(): Promise<void> {
    try {
      await this.refresh();
    } catch (error) {
      console.error('Error handling extension change:', error);
    }
  }

  /**
   * Update VS Code context keys based on dependency state
   */
  private async updateContextKeys(state: IDependencyState): Promise<void> {
    const contextUpdates = {
      [CONTEXT_KEYS.hasMAIO]: state.hasMAIO,
      [CONTEXT_KEYS.hasMarkdownlint]: state.hasMarkdownlint,
      [CONTEXT_KEYS.hasPasteImage]: state.hasPasteImage,
      [CONTEXT_KEYS.hasMPE]: state.hasMPE
    };

    try {
      // Use centralized context key manager for efficient batch updates
      await this.contextKeyManager.setContexts(contextUpdates);
    } catch (error) {
      console.warn('Failed to update dependency context keys:', error);
    }
  }

  /**
   * Detect changes between states and emit events
   */
  private detectAndEmitChanges(previousState: IDependencyState, currentState: IDependencyState): void {
    const changes = this.compareStates(previousState, currentState);
    
    changes.forEach(change => {
      this.changeCallbacks.forEach(callback => {
        try {
          callback(change);
        } catch (error) {
          console.error('Error in dependency change callback:', error);
        }
      });
    });
  }

  /**
   * Compare two dependency states and return change events
   */
  private compareStates(previous: IDependencyState, current: IDependencyState): IDependencyChangeEvent[] {
    const changes: IDependencyChangeEvent[] = [];

    // Check each tracked extension
    Object.values(EXTENSION_IDS).forEach(extensionId => {
      const prevExt = previous.extensions[extensionId];
      const currExt = current.extensions[extensionId];

      // Extension was installed
      if (!prevExt?.isInstalled && currExt?.isInstalled) {
        changes.push({
          extensionId,
          changeType: 'installed',
          previousState: previous,
          currentState: current,
          timestamp: Date.now()
        });
      }
      
      // Extension was uninstalled
      else if (prevExt?.isInstalled && !currExt?.isInstalled) {
        changes.push({
          extensionId,
          changeType: 'uninstalled', 
          previousState: previous,
          currentState: current,
          timestamp: Date.now()
        });
      }
      
      // Extension was activated
      else if (prevExt?.isInstalled && !prevExt?.isActive && currExt?.isActive) {
        changes.push({
          extensionId,
          changeType: 'enabled',
          previousState: previous,
          currentState: current,
          timestamp: Date.now()
        });
      }
      
      // Extension was deactivated
      else if (prevExt?.isActive && currExt?.isInstalled && !currExt?.isActive) {
        changes.push({
          extensionId,
          changeType: 'disabled',
          previousState: previous,
          currentState: current,
          timestamp: Date.now()
        });
      }
    });

    return changes;
  }

  /**
   * Create extension info for missing extension
   */
  private createMissingExtensionInfo(extensionId: string): IExtensionInfo {
    return {
      id: extensionId,
      name: this.extractNameFromId(extensionId),
      displayName: extensionId,
      isInstalled: false,
      isActive: false,
      isDisabled: false,
      version: undefined,
      commands: [],
      canUseAPI: false
    };
  }

  /**
   * Extract simple name from extension ID
   */
  private extractNameFromId(extensionId: string): string {
    return extensionId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Extract available commands from extension
   */
  private extractCommands(extension: any): string[] {
    try {
      const commands = extension.packageJSON?.contributes?.commands;
      return Array.isArray(commands) 
        ? commands.map((cmd: any) => cmd.command).filter(Boolean)
        : [];
    } catch (error) {
      return [];
    }
  }
}