/**
 * @moduleName: Status Bar Manager - UI Layer Controller
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Context-aware status bar UI management with real-time button state updates and theme integration
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../settings/SettingsAdapter, ../engine/ContextDetector
 * @requirementsTraceability:
 *   {@link Requirements.REQ_UI_001} (Status Bar Integration)
 *   {@link Requirements.REQ_UI_002} (Context-Aware Button States)
 *   {@link Requirements.REQ_UI_003} (Theme Integration)
 *   {@link Requirements.REQ_UI_004} (Real-time Updates)
 * @briefDescription: Manages the VS Code status bar toolbar with context-aware button states. Handles button creation, visibility management, theme integration, and real-time updates based on cursor position and configuration changes
 * @methods: constructor, initialize, updateVisibility, updateButtonStates, createStatusBarItems, dispose
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Button activation: Cursor in "**bold**" → Bold button shows active state
 *   - Theme integration: Automatic color adaptation using ThemeColor
 *   - Configuration: Dynamic button layout based on user settings
 * @vulnerabilitiesAssessment: VS Code API sandboxing, proper resource disposal, event listener cleanup, input validation
 */

import * as vscode from 'vscode';
import { SettingsAdapter } from '../settings/SettingsAdapter';
import { ContextDetector } from '../engine/ContextDetector';
import { logger } from '../services/Logger';
import { ButtonId, BUTTON_DEFINITIONS } from '../types/Buttons';
import { IPresetManager } from '../presets/PresetManager';

/**
 * Button configuration for status bar items
 */
interface IButtonConfig {
    id: string;
    command: string;
    text: string;
    tooltip: string;
    priority: number;
}

/**
 * Manages status bar items for Markdown Extended Toolbar
 */
export class StatusBarManager {
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private settings: SettingsAdapter;
    private contextDetector: ContextDetector;
    private presetManager: IPresetManager;
    private disposables: vscode.Disposable[] = [];
    private isVisible: boolean = false;

    constructor(presetManager: IPresetManager) {
        this.settings = new SettingsAdapter();
        this.contextDetector = new ContextDetector();
        this.presetManager = presetManager;
        this.initialize();
    }

    /**
     * Initializes the status bar manager
     */
    private initialize(): void {
        // Listen for active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                this.updateVisibility(editor);
            })
        );

        // Listen for selection changes
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection((event) => {
                if (this.isVisible && event.textEditor.document.languageId === 'markdown') {
                    this.updateButtonStates(event.textEditor);
                }
            })
        );

        // Listen for configuration changes
        this.disposables.push(
            this.settings.onConfigurationChanged(() => {
                this.onConfigurationChanged();
            })
        );

        // Initial setup - don't await, just fire and forget
        this.createStatusBarItems().catch(error => {
            console.error('Failed to create status bar items:', error);
        });
        this.updateVisibility(vscode.window.activeTextEditor);
    }

    /**
     * Creates status bar items based on current preset
     */
    private async createStatusBarItems(): Promise<void> {
        const config = this.settings.getConfiguration();
        const alignment = config.position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;

        // Dispose existing items
        this.statusBarItems.forEach(item => item.dispose());
        this.statusBarItems.clear();

        if (!config.enabled) {
            return;
        }

        // Get effective buttons from preset manager
        const effectiveButtons = await this.presetManager.getEffectiveButtons();

        // Create items for each effective button
        effectiveButtons.forEach((buttonId, index) => {
            const buttonDef = BUTTON_DEFINITIONS[buttonId];
            if (buttonDef) {
                const item = vscode.window.createStatusBarItem(alignment, 100 - index);
                item.command = buttonDef.commandId;
                item.text = buttonDef.icon;
                item.tooltip = buttonDef.tooltip;

                this.statusBarItems.set(buttonId, item);
            }
        });
    }

    /**
     * Updates visibility based on active editor
     * @param editor Current active editor
     */
    private updateVisibility(editor: vscode.TextEditor | undefined): void {
        const shouldShow = editor?.document.languageId === 'markdown' && this.settings.isToolbarEnabled();

        if (shouldShow !== this.isVisible) {
            this.isVisible = shouldShow;

            if (shouldShow) {
                this.showItems();
                if (editor) {
                    this.updateButtonStates(editor);
                }
            } else {
                this.hideItems();
            }
        }
    }

    /**
     * Shows all status bar items
     */
    private showItems(): void {
        this.statusBarItems.forEach(item => item.show());
    }

    /**
     * Hides all status bar items
     */
    private hideItems(): void {
        this.statusBarItems.forEach(item => item.hide());
    }

    /**
     * Updates button states based on current context
     * @param editor Current text editor
     */
    private updateButtonStates(editor: vscode.TextEditor): void {
        try {
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText();

            const selectionStart = document.offsetAt(selection.start);
            const selectionEnd = document.offsetAt(selection.end);

            const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);

            // Update bold button
            const boldItem = this.statusBarItems.get('fmt.bold');
            if (boldItem) {
                if (context.isBold) {
                    boldItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                    boldItem.tooltip = 'Remove Bold (Ctrl+B)';
                } else {
                    boldItem.backgroundColor = undefined;
                    boldItem.tooltip = 'Bold (Ctrl+B)';
                }
            }

            // Update italic button
            const italicItem = this.statusBarItems.get('fmt.italic');
            if (italicItem) {
                if (context.isItalic) {
                    italicItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                    italicItem.tooltip = 'Remove Italic (Ctrl+I)';
                } else {
                    italicItem.backgroundColor = undefined;
                    italicItem.tooltip = 'Italic (Ctrl+I)';
                }
            }

            // Update code button
            const codeItem = this.statusBarItems.get('code.inline');
            if (codeItem) {
                if (context.isCode) {
                    codeItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                    codeItem.tooltip = 'Remove Inline Code';
                } else {
                    codeItem.backgroundColor = undefined;
                    codeItem.tooltip = 'Inline Code';
                }
            }

            // Update link button
            const linkItem = this.statusBarItems.get('link.insert');
            if (linkItem) {
                if (context.isLink) {
                    linkItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                    linkItem.tooltip = `Remove Link${context.linkUrl ? ` (${context.linkUrl})` : ''}`;
                } else {
                    linkItem.backgroundColor = undefined;
                    linkItem.tooltip = 'Insert Link (Ctrl+K)';
                }
            }

            // Update list button
            const listItem = this.statusBarItems.get('list.toggle');
            if (listItem) {
                if (context.isList) {
                    listItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                    const listTypeText = context.listType === 'numbered' ? 'Numbered' : 'Bullet';
                    listItem.tooltip = `Remove ${listTypeText} List`;
                } else {
                    listItem.backgroundColor = undefined;
                    listItem.tooltip = 'Bullet/Numbered List';
                }
            }

        } catch (error) {
            logger.error('Error updating button states:', error);
        }
    }

    /**
     * Handles configuration changes
     */
    private onConfigurationChanged(): void {
        this.createStatusBarItems().catch(error => {
            console.error('Failed to recreate status bar items on config change:', error);
        });
        this.updateVisibility(vscode.window.activeTextEditor);
    }

    /**
     * Forces a refresh of button states
     */
    public refreshButtonStates(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.isVisible) {
            this.updateButtonStates(editor);
        }
    }

    /**
     * Gets the current visibility state
     */
    public getVisibility(): boolean {
        return this.isVisible;
    }

    /**
     * Gets the number of active status bar items
     */
    public getActiveItemCount(): number {
        return this.statusBarItems.size;
    }

    /**
     * Disposes all resources
     */
    public dispose(): void {
        // Dispose status bar items
        this.statusBarItems.forEach(item => item.dispose());
        this.statusBarItems.clear();

        // Dispose event listeners
        this.disposables.forEach(disposable => {
            try {
                disposable.dispose();
            } catch (error) {
                logger.error('Error disposing status bar manager resource:', error);
            }
        });
        this.disposables = [];
    }
}
