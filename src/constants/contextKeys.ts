/**
 * @moduleName: Context Keys - VS Code Context Key Constants
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Centralized constants for VS Code context keys used in conditional UI visibility
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_CONSTANTS_004} (Context Key Definitions)
 *   {@link Requirements.REQ_CONSTANTS_005} (UI Visibility Constants)
 *   {@link Requirements.REQ_CONSTANTS_006} (Conditional Logic Constants)
 * @briefDescription: Defines all VS Code context keys used for controlling menu visibility, button states, and conditional UI behavior. Includes dependency detection, formatting context, and editor state keys
 * @methods: Constants and type definitions only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - CONTEXT_KEYS.hasMAIO: 'mdToolbar.hasMAIO'
 *   - CONTEXT_KEYS.isBold: 'mdToolbar.isBold'
 *   - IContextKeyManager: Interface for context key management
 * @vulnerabilitiesAssessment: Type safety validation, compile-time error detection, no runtime security concerns
 */

/**
 * VS Code context keys for conditional UI visibility
 */

export const CONTEXT_KEYS = {
  // Extension dependencies
  hasMAIO: 'mdToolbar.hasMAIO',
  hasMarkdownlint: 'mdToolbar.hasMarkdownlint',
  hasPasteImage: 'mdToolbar.hasPasteImage',
  hasMPE: 'mdToolbar.hasMPE',
  
  // Current preset
  preset: 'mdToolbar.preset',           // 'core'|'writer'|'pro'|'custom'
  
  // Context-aware features
  inTable: 'mdToolbar.inTable',
  onTaskLine: 'mdToolbar.onTaskLine',
  
  // Formatting context (for button state updates)
  isBold: 'mdToolbar.isBold',
  isItalic: 'mdToolbar.isItalic', 
  isCode: 'mdToolbar.isCode',
  isStrikethrough: 'mdToolbar.isStrikethrough',
  isLink: 'mdToolbar.isLink',
  isList: 'mdToolbar.isList',
  
  // Editor state
  isMarkdownFile: 'editorLangId == markdown',
  hasSelection: 'mdToolbar.hasSelection',
  
  // UI state
  toolbarEnabled: 'mdToolbar.enabled',
  compactMode: 'mdToolbar.compact'
} as const;

/**
 * Context key groups for bulk operations
 */
export const CONTEXT_KEY_GROUPS = {
  DEPENDENCIES: [
    CONTEXT_KEYS.hasMAIO,
    CONTEXT_KEYS.hasMarkdownlint, 
    CONTEXT_KEYS.hasPasteImage,
    CONTEXT_KEYS.hasMPE
  ],
  
  CONTEXT_AWARENESS: [
    CONTEXT_KEYS.inTable,
    CONTEXT_KEYS.onTaskLine
  ],
  
  FORMATTING_STATE: [
    CONTEXT_KEYS.isBold,
    CONTEXT_KEYS.isItalic,
    CONTEXT_KEYS.isCode, 
    CONTEXT_KEYS.isStrikethrough,
    CONTEXT_KEYS.isLink,
    CONTEXT_KEYS.isList
  ],
  
  UI_STATE: [
    CONTEXT_KEYS.preset,
    CONTEXT_KEYS.toolbarEnabled,
    CONTEXT_KEYS.compactMode,
    CONTEXT_KEYS.hasSelection
  ]
} as const;

/**
 * Helper type for context key values
 */
export type ContextKeyValue = string | number | boolean | undefined;

/**
 * Interface for context key manager
 */
export interface IContextKeyManager {
  setContext(key: string, value: ContextKeyValue): void;
  getContext(key: string): ContextKeyValue;
  clearContext(key: string): void;
  setContexts(contexts: Record<string, ContextKeyValue>): void;
  dispose(): void;
}