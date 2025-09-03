/**
 * @moduleName: Dependency Types - Extension Dependency Type Definitions
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Type definitions for VS Code extension dependency detection and management
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_TYPES_004} (Dependency Type Definitions)
 *   {@link Requirements.REQ_TYPES_005} (Extension State Types)
 *   {@link Requirements.REQ_TYPES_006} (API Access Types)
 * @briefDescription: Defines TypeScript interfaces and types for managing VS Code extension dependencies including detection, state tracking, and API access validation
 * @methods: Type definitions and interfaces only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - EXTENSION_IDS: Constants for known extension identifiers
 *   - IExtensionInfo: Complete extension state information
 *   - IDependencyState: Overall dependency system state
 * @vulnerabilitiesAssessment: Type safety validation, compile-time error detection, no runtime security concerns
 */

/**
 * Extension dependency detection interfaces and types
 */

/**
 * Known markdown-related extension IDs
 */
export const EXTENSION_IDS = {
  MAIO: 'yzhang.markdown-all-in-one',
  MARKDOWNLINT: 'DavidAnson.vscode-markdownlint',
  PASTE_IMAGE: 'mushan.vscode-paste-image',
  MPE: 'shd101wyy.markdown-preview-enhanced',
  MARKDOWN_PDF: 'yzane.markdown-pdf'
} as const;

/**
 * Extension information for dependency detection
 */
export interface IExtensionInfo {
  id: string;
  name: string;
  displayName: string;
  isInstalled: boolean;
  isActive: boolean;          // Extension is running (isActive)
  isDisabled: boolean;        // Extension is installed but disabled
  version?: string;
  commands?: string[];
  canUseAPI: boolean;         // Whether we can access ext.exports
}

/**
 * Current state of all tracked dependencies
 */
export interface IDependencyState {
  hasMAIO: boolean;
  hasMarkdownlint: boolean;
  hasPasteImage: boolean;
  hasMPE: boolean;
  hasMarkdownPdf: boolean;

  // Detailed extension info
  extensions: Record<string, IExtensionInfo>;

  // Last update timestamp for caching
  lastUpdated: number;
}

/**
 * Dependency change event
 */
export interface IDependencyChangeEvent {
  extensionId: string;
  changeType: 'installed' | 'uninstalled' | 'enabled' | 'disabled';
  previousState: IDependencyState;
  currentState: IDependencyState;
  timestamp: number;
}

/**
 * Extension detection service interface
 */
export interface IDependencyDetector {
  /**
   * Get current state of all dependencies
   */
  getCurrentState(): Promise<IDependencyState>;

  /**
   * Detect a specific extension
   */
  detectExtension(extensionId: string): IExtensionInfo;

  /**
   * Check if extension is available for use (installed and active)
   */
  isExtensionAvailable(extensionId: string): boolean;

  /**
   * Check if extension is installed (regardless of active state)
   */
  isExtensionInstalled(extensionId: string): boolean;

  /**
   * Attempt to activate an extension if it's installed but not active
   */
  ensureExtensionActive(extensionId: string): Promise<boolean>;

  /**
   * Listen for extension state changes
   */
  onDidChangeExtensions(callback: (event: IDependencyChangeEvent) => void): any; // Disposable

  /**
   * Refresh detection state (for manual refresh)
   */
  refresh(): Promise<IDependencyState>;

  /**
   * Dispose resources
   */
  dispose(): void;
}

/**
 * Configuration for dependency detection behavior
 */
export interface IDependencyDetectorConfig {
  // Cache detection results for this many milliseconds
  cacheTimeout: number;

  // Extensions to track
  trackedExtensions: string[];

  // Whether to auto-detect extension changes
  autoDetectChanges: boolean;

  // Whether to show notifications about missing dependencies
  showMissingDependencyNotifications: boolean;
}

/**
 * Result of attempting to execute a delegated command
 */
export interface ICommandDelegationResult {
  success: boolean;
  executed: boolean;
  commandId?: string;
  error?: string;
  fallbackUsed: boolean;
  extensionRequired?: string;
}

/**
 * Service for handling command delegation and fallbacks
 */
export interface ICommandDelegationService {
  /**
   * Execute a command, with fallback if delegation fails
   */
  executeCommand(
    buttonId: string,
    args?: any[]
  ): Promise<ICommandDelegationResult>;

  /**
   * Check if command can be delegated (extension available)
   */
  canDelegate(buttonId: string): boolean;

  /**
   * Show CTA to install missing extension
   */
  showInstallCTA(extensionId: string): Promise<boolean>;
}