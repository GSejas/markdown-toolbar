/**
 * @moduleName: Settings Adapter - Configuration Management Layer
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Type-safe configuration management with dependency injection for testing and reactive updates
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_SETTINGS_001} (Configuration Schema)
 *   {@link Requirements.REQ_SETTINGS_002} (Type Safety)
 *   {@link Requirements.REQ_SETTINGS_003} (Dependency Injection)
 *   {@link Requirements.REQ_SETTINGS_004} (Reactive Updates)
 * @briefDescription: Manages VS Code workspace configuration for the markdown toolbar extension. Provides type-safe access to settings with validation, defaults, and reactive change notifications. Uses constructor injection for testability
 * @methods: constructor, getConfiguration, isToolbarEnabled, getToolbarPosition, getActiveButtons, onConfigurationChanged
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Test injection: new SettingsAdapter(mockVscode)
 *   - Reactive updates: Listen to onConfigurationChanged for UI updates
 *   - Validation: Automatic fallback to defaults for invalid values
 * @vulnerabilitiesAssessment: Input validation, type safety, VS Code API sandboxing, proper error handling
 */

import type * as vscode from 'vscode';

/**
 * Configuration interface for markdown toolbar settings
 */
export interface IMarkdownToolbarConfig {
  enabled: boolean;
  position: 'left' | 'right';
  buttons: string[];
}

/**
 * Type-safe settings adapter for markdown toolbar configuration
 */
export class SettingsAdapter {
  private static readonly SECTION = 'markdownToolbar';
  private vscode: any;

  constructor(vscodeImpl?: any) {
    // Use injected implementation when provided (tests). Lazily require vscode at runtime otherwise.
    if (vscodeImpl) {
      this.vscode = vscodeImpl;
    } else {
      // avoid static import to keep tests fast; require at runtime when running inside VS Code
      this.vscode = typeof require !== 'undefined' ? require('vscode') : ({} as any);
    }
  }
  
  /**
   * Gets whether the toolbar is enabled
   * @returns boolean indicating if toolbar is enabled
   */
  public isToolbarEnabled(): boolean {
  const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
  const enabled = config.get ? config.get('enabled', true) : undefined;
  return typeof enabled === 'boolean' ? enabled : true;
  }

  /**
   * Gets the toolbar position in status bar
   * @returns 'left' or 'right' alignment
   */
  public getToolbarPosition(): 'left' | 'right' {
  const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
  const position = config.get ? config.get('position', 'right') : undefined;
  return position === 'left' ? 'left' : 'right';
  }

  /**
   * Gets the list of active toolbar buttons
   * @returns Array of button identifiers
   */
  public getActiveButtons(): string[] {
  const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
  const buttons = config.get ? config.get('buttons', ['bold', 'italic', 'code', 'link', 'list']) : undefined;
  return Array.isArray(buttons) ? buttons : ['bold', 'italic', 'code', 'link', 'list'];
  }

  /**
   * Gets complete configuration object
   * @returns Full configuration interface
   */
  public getConfiguration(): IMarkdownToolbarConfig {
    return {
      enabled: this.isToolbarEnabled(),
      position: this.getToolbarPosition(),
      buttons: this.getActiveButtons()
    };
  }

  /**
   * Updates a configuration value
   * @param key Configuration key to update
   * @param value New value
   * @param target Configuration target (Global, Workspace, etc.)
   */
  public async updateConfiguration<T>(
    key: keyof IMarkdownToolbarConfig,
    value: T,
    target?: any
  ): Promise<void> {
    const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
    const cfgTarget = typeof target !== 'undefined' ? target : (this.vscode && this.vscode.ConfigurationTarget ? this.vscode.ConfigurationTarget.Workspace : undefined);
    await config.update(key as string, value, cfgTarget);
  }

  /**
   * Validates if a button name is supported
   * @param buttonName Button identifier to validate
   * @returns boolean indicating if button is valid
   */
  public isValidButton(buttonName: string): boolean {
    const validButtons = ['bold', 'italic', 'code', 'link', 'list'];
    return validButtons.includes(buttonName);
  }

  /**
   * Listens for configuration changes
   * @param callback Function to call when configuration changes
   * @returns Disposable for the event listener
   */
  public onConfigurationChanged(
    callback: (config: IMarkdownToolbarConfig) => void
  ): any {
    return this.vscode.workspace.onDidChangeConfiguration((event: any) => {
      if (event.affectsConfiguration(SettingsAdapter.SECTION)) {
        callback(this.getConfiguration());
      }
    });
  }
}
