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
 * @briefDescription: Manages VS Code workspace configuration for the Markdown Extended Toolbar extension. Provides type-safe access to settings with validation, defaults, and reactive change notifications. Uses constructor injection for testability
 * @methods: constructor, getConfiguration, isToolbarEnabled, getToolbarPosition, getActiveButtons, onConfigurationChanged
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Test injection: new SettingsAdapter(mockVscode)
 *   - Reactive updates: Listen to onConfigurationChanged for UI updates
 *   - Validation: Automatic fallback to defaults for invalid values
 * @vulnerabilitiesAssessment: Input validation, type safety, VS Code API sandboxing, proper error handling
 */

import type * as vscode from 'vscode';
import { CONFIG_KEYS, DEFAULT_CONFIG } from '../constants/configKeys';
import { ButtonId } from '../types/Buttons';

/**
 * Configuration interface for Markdown Extended Toolbar settings
 */
export interface IMarkdownToolbarConfig {
    enabled: boolean;
    position: 'left' | 'right';
    preset: string;
    customButtons: ButtonId[];
    codeLensDisplayMode: 'minimal' | 'explicit';
}

/**
 * Type-safe settings adapter for Markdown Extended Toolbar configuration
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
        // In the new system, toolbar is always enabled if a preset is selected
        const preset = this.getPreset();
        return preset !== null && preset !== undefined;
    }

    /**
     * Gets the toolbar position in status bar
     * @returns 'right' (fixed position for now)
     */
    public getToolbarPosition(): 'left' | 'right' {
        // For now, always use right position
        // This could be made configurable in the future
        return 'right';
    }

    /**
     * Gets the current preset
     * @returns Active preset ID
     */
    public getPreset(): string {
        const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
        return config.get('preset', DEFAULT_CONFIG.preset);
    }

    /**
     * Gets the list of active toolbar buttons
     * @returns Array of button identifiers (ButtonId format)
     */
    public getActiveButtons(): ButtonId[] {
        const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);

        // If the user has selected the custom preset, use custom.visibleButtons setting
        const preset = config.get('preset', DEFAULT_CONFIG.preset);
        if (preset === 'custom') {
            const customButtons = config.get('custom.visibleButtons', DEFAULT_CONFIG.customVisible);
            return Array.isArray(customButtons) ? customButtons as ButtonId[] : [];
        }

        // For non-custom presets, we should let PresetManager handle button selection
        // This method is mainly for legacy UI compatibility
        return [];
    }

    /**
     * Gets the CodeLens display mode setting
     * @returns Display mode: 'minimal' (icons only) or 'explicit' (icons + text)
     */
    public getCodeLensDisplayMode(): 'minimal' | 'explicit' {
        const config = this.vscode.workspace.getConfiguration(SettingsAdapter.SECTION);
        return config.get('codeLens.displayMode', 'explicit') as 'minimal' | 'explicit';
    }

    /**
     * Gets complete configuration object
     * @returns Full configuration interface
     */
    public getConfiguration(): IMarkdownToolbarConfig {
        return {
            enabled: this.isToolbarEnabled(),
            position: this.getToolbarPosition(),
            preset: this.getPreset(),
            customButtons: this.getActiveButtons(),
            codeLensDisplayMode: this.getCodeLensDisplayMode()
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
     * Validates if a button ID is supported
     * @param buttonId Button identifier to validate
     * @returns boolean indicating if button is valid
     */
    public isValidButton(buttonId: string): boolean {
        // Import ButtonId type at runtime to avoid circular imports
        const validButtons = [
            'preview.side', 'preview.current',
            'fmt.bold', 'fmt.italic', 'fmt.strike',
            'list.toggle', 'task.toggle',
            'code.inline', 'code.block',
            'link.insert', 'image.insert', 'image.paste',
            'toc.create', 'toc.update', 'toc.addNumbers', 'toc.removeNumbers',
            'table.menu',
            'lint.fix', 'lint.workspace',
            'preview.mpe.side', 'preview.mpe.current'
        ];
        return validButtons.includes(buttonId);
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
