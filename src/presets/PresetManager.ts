/**
 * @moduleName: Preset Manager - Configuration Preset System
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Intelligent preset management system for toolbar configurations with dependency awareness and user preferences
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../types/Buttons, ../types/Dependencies, ../constants/configKeys, ../constants/contextKeys
 * @requirementsTraceability:
 *   {@link Requirements.REQ_PRESETS_001} (Preset Definitions)
 *   {@link Requirements.REQ_PRESETS_002} (Dynamic Switching)
 *   {@link Requirements.REQ_PRESETS_003} (Dependency Integration)
 *   {@link Requirements.REQ_PRESETS_004} (User Preferences)
 * @briefDescription: Manages toolbar configuration presets with intelligent switching based on detected dependencies and user preferences. Provides preset definitions, validation, and seamless transitions between different toolbar configurations
 * @methods: getCurrentPreset, switchPreset, detectOptimalPreset, validatePreset, onPresetChange
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Auto-detection: Switch to 'full' preset when all dependencies available
 *   - User switching: Manual preset selection with validation
 *   - Dependency integration: Adjust available buttons based on installed extensions
 * @vulnerabilitiesAssessment: Input validation, dependency checking, configuration sanitization, error boundary handling
 */

import {
  ButtonId,
  PresetId,
  IPresetDefinition,
  PRESET_DEFINITIONS,
  BUTTON_DEFINITIONS
} from '../types/Buttons';
import { IDependencyDetector } from '../types/Dependencies';
import { CONFIG_KEYS, DEFAULT_CONFIG } from '../constants/configKeys';
import { CONTEXT_KEYS } from '../constants/contextKeys';

/**
 * Event fired when preset changes
 */
export interface IPresetChangeEvent {
  previousPreset: PresetId;
  currentPreset: PresetId;
  triggeredBy: 'user' | 'auto' | 'config';
  availableButtons: ButtonId[];
  suggestedPreset?: PresetId;
  reason?: string;
  timestamp: number;
}

/**
 * Interface for preset management
 */
export interface IPresetManager {
  getCurrentPreset(): IPresetDefinition;
  switchPreset(presetId: PresetId): Promise<void>;
  getEffectiveButtons(): ButtonId[];
  getCustomButtons(): ButtonId[];
  setCustomButtons(buttons: ButtonId[]): Promise<void>;
  onDidChangePreset(callback: (event: IPresetChangeEvent) => void): { dispose(): void };
  dispose(): void;
}

/**
 * Manages preset selection and button filtering based on extension availability
 */
export class PresetManager implements IPresetManager {
  private vscode: any;
  private dependencyDetector: IDependencyDetector;
  private changeCallbacks: Array<(event: IPresetChangeEvent) => void> = [];
  private disposables: Array<{ dispose(): void }> = [];
  private currentPresetCache: IPresetDefinition | null = null;

  constructor(
    vscodeImpl?: any,
    dependencyDetector?: IDependencyDetector
  ) {
    this.vscode = vscodeImpl || require('vscode');
    this.dependencyDetector = dependencyDetector!; // Required dependency
    
    this.initialize();
  }

  /**
   * Get the currently active preset definition
   */
  public getCurrentPreset(): IPresetDefinition {
    // Return cached preset if available
    if (this.currentPresetCache) {
      return this.currentPresetCache;
    }

    const config = this.vscode.workspace.getConfiguration(CONFIG_KEYS.root);
    const presetId = config.get('preset', DEFAULT_CONFIG.preset) as PresetId;
    
    // Validate preset ID
    if (!this.isValidPresetId(presetId)) {
      console.warn(`Invalid preset ID: ${presetId}, falling back to core`);
      return PRESET_DEFINITIONS.core;
    }

    // Handle custom preset
    if (presetId === 'custom') {
      const customButtons = this.getCustomButtons();
      const customPreset: IPresetDefinition = {
        ...PRESET_DEFINITIONS.custom,
        buttons: customButtons
      };
      this.currentPresetCache = customPreset;
      return customPreset;
    }

    // Return predefined preset
    const preset = PRESET_DEFINITIONS[presetId];
    this.currentPresetCache = preset;
    return preset;
  }

  /**
   * Switch to a different preset
   */
  public async switchPreset(presetId: PresetId): Promise<void> {
    if (!this.isValidPresetId(presetId)) {
      console.warn(`Cannot switch to invalid preset: ${presetId}`);
      return;
    }

    const previousPreset = this.getCurrentPreset();
    
    try {
      // Update configuration
      const config = this.vscode.workspace.getConfiguration(CONFIG_KEYS.root);
      await config.update('preset', presetId, this.vscode.ConfigurationTarget.Global);

      // Update context key for menu visibility
      await this.vscode.commands.executeCommand('setContext', CONTEXT_KEYS.preset, presetId);

      // Clear cache to force refresh
      this.currentPresetCache = null;
      
      // Get new preset for comparison
      const currentPreset = this.getCurrentPreset();
      
      // Emit change event
      const event: IPresetChangeEvent = {
        previousPreset: previousPreset.id,
        currentPreset: presetId,
        triggeredBy: 'user',
        availableButtons: this.getEffectiveButtons(),
        timestamp: Date.now()
      };

      this.emitPresetChange(event);

    } catch (error) {
      console.error(`Failed to switch preset to ${presetId}:`, error);
      throw error;
    }
  }

  /**
   * Get effective buttons filtered by extension availability
   */
  public getEffectiveButtons(): ButtonId[] {
    const preset = this.getCurrentPreset();
    const dependencyState = this.dependencyDetector.getCurrentState();

    // Filter buttons based on extension availability
    return preset.buttons.filter(buttonId => {
      const buttonDef = BUTTON_DEFINITIONS[buttonId];
      
      // If button has no extension requirement, always include it
      if (!buttonDef.requiresExtension) {
        return true;
      }

      // Check if required extension is available
      return this.dependencyDetector.isExtensionAvailable(buttonDef.requiresExtension);
    });
  }

  /**
   * Get current custom button list
   */
  public getCustomButtons(): ButtonId[] {
    const config = this.vscode.workspace.getConfiguration(CONFIG_KEYS.root);
    const customButtons = config.get('custom.visibleButtons', DEFAULT_CONFIG.customVisible) as string[] | undefined;
    
    // Handle undefined result
    if (!customButtons || !Array.isArray(customButtons)) {
      return [];
    }
    
    // Validate and filter custom buttons
    return customButtons.filter(buttonId => this.isValidButtonId(buttonId)) as ButtonId[];
  }

  /**
   * Set custom button list
   */
  public async setCustomButtons(buttons: ButtonId[]): Promise<void> {
    // Validate and filter buttons
    const validButtons = buttons.filter(buttonId => this.isValidButtonId(buttonId));
    
    if (validButtons.length !== buttons.length) {
      const invalidButtons = buttons.filter(buttonId => !this.isValidButtonId(buttonId));
      console.warn(`Filtered out invalid button IDs: ${invalidButtons.join(', ')}`);
    }

    try {
      // Update configuration
      const config = this.vscode.workspace.getConfiguration(CONFIG_KEYS.root);
      await config.update(
        'custom.visibleButtons', 
        validButtons, 
        this.vscode.ConfigurationTarget.Global
      );

      // Clear cache if current preset is custom
      const currentPreset = this.getCurrentPreset();
      if (currentPreset.id === 'custom') {
        this.currentPresetCache = null;
      }

    } catch (error) {
      console.error('Failed to update custom buttons:', error);
      throw error;
    }
  }

  /**
   * Listen for preset change events
   */
  public onDidChangePreset(callback: (event: IPresetChangeEvent) => void): { dispose(): void } {
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
   * Dispose all resources
   */
  public dispose(): void {
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        console.warn('Error disposing preset manager resource:', error);
      }
    });
    this.disposables = [];
    this.changeCallbacks = [];
    this.currentPresetCache = null;
  }

  /**
   * Initialize the preset manager
   */
  private initialize(): void {
    // Listen for configuration changes
    const configDisposable = this.vscode.workspace.onDidChangeConfiguration((event: any) => {
      if (event.affectsConfiguration(CONFIG_KEYS.root)) {
        this.handleConfigurationChange(event);
      }
    });
    this.disposables.push(configDisposable);

    // Listen for dependency changes for auto-switching
    const depDisposable = this.dependencyDetector.onDidChangeExtensions((event) => {
      this.handleDependencyChange(event);
    });
    this.disposables.push(depDisposable);

    // Set initial context key
    this.updateContextKeys();
  }

  /**
   * Handle VS Code configuration changes
   */
  private handleConfigurationChange(event: any): void {
    const previousPreset = this.currentPresetCache?.id || 'core';
    
    // Clear cache to force refresh
    this.currentPresetCache = null;
    
    const currentPreset = this.getCurrentPreset();
    
    // Emit change event if preset actually changed
    if (previousPreset !== currentPreset.id) {
      const changeEvent: IPresetChangeEvent = {
        previousPreset,
        currentPreset: currentPreset.id,
        triggeredBy: 'config',
        availableButtons: this.getEffectiveButtons(),
        timestamp: Date.now()
      };

      this.emitPresetChange(changeEvent);
    }

    // Update context keys
    this.updateContextKeys();
  }

  /**
   * Handle extension dependency changes for auto-switching
   */
  private handleDependencyChange(event: any): void {
    // Only handle installation events for auto-switching suggestions
    if (event.changeType !== 'installed') {
      return;
    }

    const currentPreset = this.getCurrentPreset();
    const suggestedPreset = this.suggestPresetUpgrade(currentPreset.id, event.extensionId);
    
    if (suggestedPreset && suggestedPreset !== currentPreset.id) {
      const changeEvent: IPresetChangeEvent = {
        previousPreset: currentPreset.id,
        currentPreset: currentPreset.id, // Not actually changing yet
        triggeredBy: 'auto',
        availableButtons: this.getEffectiveButtons(),
        suggestedPreset,
        reason: 'extension-installed',
        timestamp: Date.now()
      };

      this.emitPresetChange(changeEvent);
    }
  }

  /**
   * Suggest preset upgrade based on newly available extensions
   */
  private suggestPresetUpgrade(currentPresetId: PresetId, newExtensionId: string): PresetId | null {
    // Don't suggest upgrades for custom preset
    if (currentPresetId === 'custom') {
      return null;
    }

    // Suggest Writer if user has Core and MAIO is installed
    if (currentPresetId === 'core' && newExtensionId === 'yzhang.markdown-all-in-one') {
      return 'writer';
    }

    // Suggest Pro if user has Writer and gets markdownlint or MPE
    if (currentPresetId === 'writer') {
      if (newExtensionId === 'DavidAnson.vscode-markdownlint' || 
          newExtensionId === 'shd101wyy.markdown-preview-enhanced') {
        // Check if all Pro requirements are now met
        const state = this.dependencyDetector.getCurrentState();
        if (state.hasMAIO && (state.hasMarkdownlint || state.hasMPE)) {
          return 'pro';
        }
      }
    }

    return null;
  }

  /**
   * Update VS Code context keys
   */
  private async updateContextKeys(): Promise<void> {
    const preset = this.getCurrentPreset();
    
    try {
      await this.vscode.commands.executeCommand('setContext', CONTEXT_KEYS.preset, preset.id);
    } catch (error) {
      console.warn('Failed to update preset context key:', error);
    }
  }

  /**
   * Emit preset change event to all listeners
   */
  private emitPresetChange(event: IPresetChangeEvent): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in preset change callback:', error);
      }
    });
  }

  /**
   * Validate preset ID
   */
  private isValidPresetId(presetId: string): presetId is PresetId {
    return Object.keys(PRESET_DEFINITIONS).includes(presetId);
  }

  /**
   * Validate button ID
   */
  private isValidButtonId(buttonId: string): buttonId is ButtonId {
    return Object.keys(BUTTON_DEFINITIONS).includes(buttonId);
  }
}