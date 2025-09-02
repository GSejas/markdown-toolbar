/**
 * @moduleName: Configuration Keys - VS Code Settings Constants
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Centralized constants for VS Code configuration keys and default values
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_CONSTANTS_001} (Configuration Key Definitions)
 *   {@link Requirements.REQ_CONSTANTS_002} (Default Value Constants)
 *   {@link Requirements.REQ_CONSTANTS_003} (Type Safety Constants)
 * @briefDescription: Defines all VS Code configuration keys used by the extension with type-safe constants and default values. Includes legacy support for migration and comprehensive settings organization
 * @methods: Constants and type definitions only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - CONFIG_KEYS.root: 'markdownToolbar'
 *   - CONFIG_KEYS.preset: 'markdownToolbar.preset'
 *   - DEFAULT_CONFIG: Complete default configuration object
 * @vulnerabilitiesAssessment: Type safety validation, compile-time error detection, no runtime security concerns
 */

/**
 * Configuration keys for VS Code settings
 */

export const CONFIG_KEYS = {
  // Root configuration section
  root: 'markdownToolbar',

  // New preset system
  preset: 'markdownToolbar.preset',                         // 'core'|'writer'|'pro'|'custom'
  customVisible: 'markdownToolbar.custom.visibleButtons',   // ButtonId[]

  // UI behavior
  compact: 'markdownToolbar.compact',                       // boolean - compact toolbar mode
  statusBarEnabled: 'markdownToolbar.statusBar.enabled',    // boolean - show preset switcher in status bar

  // Legacy settings (deprecated but supported for migration)
  enabled: 'markdownToolbar.enabled',                       // boolean - overall enable/disable
  position: 'markdownToolbar.position',                     // 'left'|'right' - status bar position  
  buttons: 'markdownToolbar.buttons',                       // string[] - old button system

  // Advanced settings
  autoDetectDependencies: 'markdownToolbar.autoDetectDependencies',    // boolean
  showMissingExtensionNotifications: 'markdownToolbar.showMissingExtensionNotifications', // boolean
  fallbackBehavior: 'markdownToolbar.fallbackBehavior',                // 'internal'|'cta'|'hide'

  // Performance settings
  contextUpdateDebounce: 'markdownToolbar.contextUpdateDebounce',      // number (ms)
  dependencyCacheTimeout: 'markdownToolbar.dependencyCacheTimeout'     // number (ms)
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  preset: 'core',
  customVisible: [],
  compact: false,
  statusBarEnabled: true,
  enabled: true,
  position: 'right',
  buttons: ['bold', 'italic', 'code', 'link', 'list'], // Legacy default
  autoDetectDependencies: true,
  showMissingExtensionNotifications: true,
  fallbackBehavior: 'internal',
  contextUpdateDebounce: 100,
  dependencyCacheTimeout: 30000
} as const;

/**
 * Configuration schema for validation
 */
export const CONFIG_SCHEMA = {
  preset: {
    type: 'string',
    enum: ['core', 'writer', 'pro', 'custom'],
    default: DEFAULT_CONFIG.preset,
    description: 'Active toolbar preset'
  },

  'custom.visibleButtons': {
    type: 'array',
    items: { type: 'string' },
    default: DEFAULT_CONFIG.customVisible,
    description: 'Visible buttons in custom preset (determines order)'
  },

  compact: {
    type: 'boolean',
    default: DEFAULT_CONFIG.compact,
    description: 'Use compact toolbar mode'
  },

  'statusBar.enabled': {
    type: 'boolean',
    default: DEFAULT_CONFIG.statusBarEnabled,
    description: 'Show preset switcher in status bar'
  },

  enabled: {
    type: 'boolean',
    default: DEFAULT_CONFIG.enabled,
    description: 'Enable markdown toolbar'
  },

  position: {
    type: 'string',
    enum: ['left', 'right'],
    default: DEFAULT_CONFIG.position,
    description: 'Status bar position'
  },

  buttons: {
    type: 'array',
    items: { type: 'string' },
    default: DEFAULT_CONFIG.buttons,
    description: 'Legacy button configuration'
  },

  autoDetectDependencies: {
    type: 'boolean',
    default: DEFAULT_CONFIG.autoDetectDependencies,
    description: 'Automatically detect extension dependencies'
  },

  showMissingExtensionNotifications: {
    type: 'boolean',
    default: DEFAULT_CONFIG.showMissingExtensionNotifications,
    description: 'Show notifications for missing extensions'
  },

  fallbackBehavior: {
    type: 'string',
    enum: ['internal', 'cta', 'hide'],
    default: DEFAULT_CONFIG.fallbackBehavior,
    description: 'Behavior when delegated commands are not available'
  },

  contextUpdateDebounce: {
    type: 'number',
    minimum: 50,
    maximum: 1000,
    default: DEFAULT_CONFIG.contextUpdateDebounce,
    description: 'Debounce delay for context updates (ms)'
  },

  dependencyCacheTimeout: {
    type: 'number',
    minimum: 5000,
    maximum: 300000,
    default: DEFAULT_CONFIG.dependencyCacheTimeout,
    description: 'Cache timeout for dependency detection (ms)'
  }
} as const;

/**
 * Configuration validation result
 */
export interface IConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration manager interface
 */
export interface IConfigManager {
  get<T = any>(key: string, defaultValue?: T): T;
  set(key: string, value: any, target?: any): Promise<void>;
  has(key: string): boolean;
  inspect(key: string): any;
  validate(config: any): IConfigValidationResult;
  onDidChange(callback: (e: any) => void): any; // Disposable
  dispose(): void;
}