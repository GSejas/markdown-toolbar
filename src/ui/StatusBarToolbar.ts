/**
 * @moduleName: Status Bar Toolbar - Main UI Component
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: The actual status bar toolbar UI that users interact with
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../types/Buttons, ../presets/PresetManager, ../services/ContextService
 * @briefDescription: Creates and manages the visual status bar toolbar with context-aware buttons
 * @methods: create, update, show, hide, dispose
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Status bar with preset buttons: [B] [I] [Code] [Link] [Preview]
 *   - Context-aware visibility: Table menu only shows when in table
 *   - Quick preset switcher: Click toolbar name to switch presets
 * @vulnerabilitiesAssessment: VS Code UI API validation, user input sanitization
 */

import { ButtonId, IButtonDefinition, BUTTON_DEFINITIONS, PresetId } from '../types/Buttons';
import { IMarkdownContext } from '../types/Context';

/**
 * The main status bar toolbar that users see and interact with
 * This is what makes it a "toolbar" - visible UI buttons in the status bar
 */
export class StatusBarToolbar {
  private vscode: any;
  private statusBarItem: any;
  private currentPreset: PresetId = 'core';
  private currentButtons: ButtonId[] = [];
  private context: IMarkdownContext | undefined = undefined;

  constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
  }

  /**
   * Create the status bar toolbar
   */
  public create(): void {
    this.statusBarItem = this.vscode.window.createStatusBarItem(
      this.vscode.StatusBarAlignment.Right,
      100 // Priority - higher numbers appear more to the left
    );

    // Make the toolbar name clickable to switch presets
    this.statusBarItem.command = 'mdToolbar.quickPresetSwitch';
    this.statusBarItem.show();
  }

  /**
   * Update toolbar with current preset and context
   */
  public update(preset: PresetId, buttons: ButtonId[], context?: IMarkdownContext): void {
    this.currentPreset = preset;
    this.currentButtons = buttons;
    this.context = context;

    // Filter buttons based on context (this is what makes it "smart")
    const visibleButtons = this.getVisibleButtons(buttons, context ?? undefined);

    // Build the toolbar text
    const toolbarText = this.buildToolbarText(visibleButtons);

    // Update status bar
    this.statusBarItem.text = `$(markdown) ${preset.toUpperCase()} ${toolbarText}`;
    this.statusBarItem.tooltip = `Markdown Extended Toolbar (${preset}) - Click to switch presets\n${visibleButtons.length} buttons available`;
  }

  /**
   * Filter buttons based on current context (smart behavior)
   */
  private getVisibleButtons(buttons: ButtonId[], context?: IMarkdownContext): IButtonDefinition[] {
    return buttons
      .map(id => BUTTON_DEFINITIONS[id])
      .filter(button => {
        // Context-aware filtering
        if (button.when) {
          switch (button.when) {
            case 'mdToolbar.inTable':
              return context?.inTable || false;
            case 'mdToolbar.onTaskLine':
              return context?.onTaskLine || false;
            case 'mdToolbar.hasMAIO':
              // This would be set by dependency detector
              return true; // For now, show all
            case 'mdToolbar.hasMarkdownlint':
              return true; // For now, show all
            case 'mdToolbar.hasMPE':
              return true; // For now, show all
            case 'mdToolbar.hasPasteImage':
              return true; // For now, show all
            default:
              return true;
          }
        }
        return true;
      });
  }

  /**
   * Build the visual toolbar text with clickable buttons
   */
  private buildToolbarText(buttons: IButtonDefinition[]): string {
    if (buttons.length === 0) {
      return '(no buttons)';
    }

    // Create clickable button representations
    const buttonTexts = buttons.slice(0, 8).map(button => { // Limit to 8 buttons for space
      // Use button icons or short text
      switch (button.id) {
        case 'fmt.bold': return '[**B**](command:mdToolbar.fmt.bold)';
        case 'fmt.italic': return '[*I*](command:mdToolbar.fmt.italic)';
        case 'fmt.strike': return '[~~S~~](command:mdToolbar.fmt.strike)';
        case 'code.inline': return '[`C`](command:mdToolbar.code.inline)';
        case 'code.block': return '[```](command:mdToolbar.code.block)';
        case 'list.toggle': return '[• List](command:mdToolbar.list.toggle)';
        case 'task.toggle': return '[☐ Task](command:mdToolbar.task.toggle)';
        case 'link.insert': return '[🔗](command:mdToolbar.link.insert)';
        case 'image.insert': return '[🖼️](command:mdToolbar.image.insert)';
        case 'preview.side': return '[👁️](command:mdToolbar.preview.side)';
        case 'table.menu': return '[📋](command:mdToolbar.table.menu)';
        case 'toc.create': return '[TOC](command:mdToolbar.toc.create)';
        case 'lint.fix': return '[🔧](command:mdToolbar.lint.fix)';
        default: return `[${button.title.charAt(0)}](command:${button.commandId})`;
      }
    });

    return buttonTexts.join(' ');
  }

  /**
   * Show a context-specific toolbar for current cursor position
   */
  public showContextualOptions(context?: IMarkdownContext): void {
    if (!context) return;

    const contextButtons: string[] = [];

    // Smart contextual suggestions
    if (context.inTable) {
      contextButtons.push('Table actions available');
    }
    if (context.onTaskLine) {
      contextButtons.push('Toggle task: ☐ ↔ ☑');
    }
    if (context.isBold) {
      contextButtons.push('Remove **bold**');
    }
    if (context.isItalic) {
      contextButtons.push('Remove *italic*');
    }

    if (contextButtons.length > 0) {
      // Could show a temporary tooltip or update status bar briefly
      this.statusBarItem.tooltip = `Markdown Context:\n${contextButtons.join('\n')}`;
    }
  }

  /**
   * Show preset switcher menu
   */
  public async showPresetSwitcher(): Promise<PresetId | undefined> {
    const presetOptions = [
      {
        label: '$(symbol-file) Core',
        description: 'Essential formatting tools',
        preset: 'core' as PresetId
      },
      {
        label: '$(pencil) Writer',
        description: 'Tools for documentation',
        preset: 'writer' as PresetId
      },
      {
        label: '$(wrench) Pro',
        description: 'Full toolkit with quality checks',
        preset: 'pro' as PresetId
      },
      {
        label: '$(settings-gear) Custom',
        description: 'Your personalized button selection',
        preset: 'custom' as PresetId
      },
      {
        label: '$(gear) Configure...',
        description: 'Open configuration generator',
        preset: 'configure' as any
      }
    ];

    const selected = await this.vscode.window.showQuickPick(presetOptions, {
      placeHolder: `Current: ${this.currentPreset.toUpperCase()} | Select a preset or configure`,
      title: 'Markdown Extended Toolbar Preset'
    });

    if (selected?.preset === 'configure') {
      // Open configuration generator
      this.vscode.commands.executeCommand('mdToolbar.openConfigGenerator');
      return undefined;
    }

    return selected?.preset;
  }

  /**
   * Show button count and status
   */
  public showStatus(): string {
    const visibleCount = this.getVisibleButtons(this.currentButtons, this.context).length;
    const totalCount = this.currentButtons.length;

    return `${visibleCount}/${totalCount} buttons • ${this.currentPreset} preset`;
  }

  /**
   * Hide the toolbar
   */
  public hide(): void {
    this.statusBarItem?.hide();
  }

  /**
   * Show the toolbar
   */
  public show(): void {
    this.statusBarItem?.show();
  }

  /**
   * Dispose of the toolbar
   */
  public dispose(): void {
    this.statusBarItem?.dispose();
  }
}