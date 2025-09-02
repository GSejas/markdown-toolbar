/**
 * @moduleName: Command Factory - Command Layer Orchestrator
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Factory pattern implementation for VS Code command registration with shared context and dependency injection
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../types/Buttons, ../types/Dependencies, ../presets/PresetManager, ../services/ContextService
 * @requirementsTraceability:
 *   {@link Requirements.REQ_COMMANDS_001} (Command Registration)
 *   {@link Requirements.REQ_COMMANDS_002} (Factory Pattern)
 *   {@link Requirements.REQ_COMMANDS_003} (Shared Context)
 *   {@link Requirements.REQ_COMMANDS_004} (Dependency Injection)
 * @briefDescription: Implements factory pattern for creating VS Code commands with shared dependency-injected context. Manages command registration, execution, and fallback behavior for markdown formatting operations
 * @methods: createCommand, createBoldCommand, createItalicCommand, createCodeCommand, createLinkCommand, createListCommand
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Command creation: createBoldCommand(context) → Disposable command handler
 *   - Context sharing: All commands receive same ICommandContext instance
 *   - Fallback handling: Graceful degradation when dependencies unavailable
 * @vulnerabilitiesAssessment: Input validation, VS Code API sandboxing, proper error handling, resource disposal
 */

import { ButtonId, IButtonDefinition, BUTTON_DEFINITIONS } from '../types/Buttons';
import { IDependencyDetector } from '../types/Dependencies';
import { IPresetManager } from '../presets/PresetManager';
import { ContextService } from '../services/ContextService';

/**
 * Command execution context
 */
export interface ICommandContext {
  vscode: any;
  dependencyDetector: IDependencyDetector;
  presetManager: IPresetManager;
  contextService: ContextService;
  fallbackBehavior: 'internal' | 'cta' | 'hide';
}

/**
 * Command execution result
 */
export interface ICommandResult {
  success: boolean;
  message?: string;
  fallbackUsed?: boolean;
  extensionRequired?: string;
}

/**
 * Command handler interface
 */
export interface ICommandHandler {
  execute(context: ICommandContext, ...args: any[]): Promise<ICommandResult>;
}

/**
 * Factory for creating command handlers
 */
export class CommandFactory {
  private static handlers: Map<string, ICommandHandler> = new Map();

  /**
   * Register a command handler
   */
  public static registerHandler(commandId: string, handler: ICommandHandler): void {
    this.handlers.set(commandId, handler);
  }

  /**
   * Create command handler for a button
   */
  public static createButtonHandler(buttonId: ButtonId): ICommandHandler {
    const buttonDef = BUTTON_DEFINITIONS[buttonId];

    return {
      execute: async (context: ICommandContext, ...args: any[]): Promise<ICommandResult> => {
        return this.executeButtonCommand(buttonDef, context, ...args);
      }
    };
  }

  /**
   * Execute a button command with delegation and fallback logic
   */
  private static async executeButtonCommand(
    buttonDef: IButtonDefinition,
    context: ICommandContext,
    ...args: any[]
  ): Promise<ICommandResult> {
    const { vscode, dependencyDetector, fallbackBehavior } = context;

    try {
      // Check if extension is required and available
      if (buttonDef.requiresExtension) {
        const isAvailable = dependencyDetector.isExtensionAvailable(buttonDef.requiresExtension);

        if (!isAvailable) {
          return this.handleMissingExtension(buttonDef, context);
        }
      }

      // Try to delegate to external command first
      if (buttonDef.delegatesTo) {
        try {
          await vscode.commands.executeCommand(buttonDef.delegatesTo, ...args);
          return { success: true };
        } catch (error) {
          console.warn(`Failed to execute delegated command ${buttonDef.delegatesTo}:`, error instanceof Error ? error.message : String(error));

          // Fall back to internal implementation if available
          if (buttonDef.fallbackCommand) {
            try {
              await vscode.commands.executeCommand(buttonDef.fallbackCommand, ...args);
              return { success: true, fallbackUsed: true };
            } catch (fallbackError) {
              console.error(`Failed to execute fallback command ${buttonDef.fallbackCommand}:`, fallbackError);
              return {
                success: false,
                message: `Both primary and fallback commands failed: ${error instanceof Error ? error.message : String(error)}`
              };
            }
          }
        }
      }

      // Execute direct command
      await vscode.commands.executeCommand(buttonDef.commandId, ...args);
      return { success: true };

    } catch (error) {
      console.error(`Error executing command for button ${buttonDef.id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle missing extension scenario
   */
  private static async handleMissingExtension(
    buttonDef: IButtonDefinition,
    context: ICommandContext
  ): Promise<ICommandResult> {
    const { vscode, fallbackBehavior } = context;

    switch (fallbackBehavior) {
      case 'internal':
        // Use internal implementation if available
        if (buttonDef.fallbackCommand) {
          try {
            await vscode.commands.executeCommand(buttonDef.fallbackCommand);
            return {
              success: true,
              fallbackUsed: true,
              message: `Used internal implementation (${buttonDef.requiresExtension} not available)`
            };
          } catch (error) {
            return {
              success: false,
              message: `Internal implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              extensionRequired: buttonDef.requiresExtension
            };
          }
        }
        break;

      case 'cta':
        // Show call-to-action to install extension
        const action = await vscode.window.showInformationMessage(
          `This feature requires the ${this.getExtensionDisplayName(buttonDef.requiresExtension!)} extension.`,
          'Install Extension',
          'Cancel'
        );

        if (action === 'Install Extension') {
          await vscode.commands.executeCommand(
            'workbench.extensions.installExtension',
            buttonDef.requiresExtension
          );
        }

        return {
          success: false,
          message: 'Extension installation required',
          extensionRequired: buttonDef.requiresExtension
        };

      case 'hide':
      default:
        // Button should be hidden, but if somehow executed, show error
        return {
          success: false,
          message: `Feature unavailable: ${buttonDef.requiresExtension} extension not installed`,
          extensionRequired: buttonDef.requiresExtension
        };
    }

    return {
      success: false,
      message: 'Extension required but not available',
      extensionRequired: buttonDef.requiresExtension
    };
  }

  /**
   * Get user-friendly extension display name
   */
  private static getExtensionDisplayName(extensionId: string): string {
    const displayNames: Record<string, string> = {
      'yzhang.markdown-all-in-one': 'Markdown All in One',
      'DavidAnson.vscode-markdownlint': 'markdownlint',
      'shd101wyy.markdown-preview-enhanced': 'Markdown Preview Enhanced',
      'mushan.vscode-paste-image': 'Paste Image'
    };

    return displayNames[extensionId] || extensionId;
  }

  /**
   * Get registered handler for command
   */
  public static getHandler(commandId: string): ICommandHandler | undefined {
    return this.handlers.get(commandId);
  }

  /**
   * Register all button command handlers
   */
  public static registerAllButtonHandlers(): void {
    Object.keys(BUTTON_DEFINITIONS).forEach(buttonId => {
      const button = BUTTON_DEFINITIONS[buttonId as ButtonId];
      this.registerHandler(button.commandId, this.createButtonHandler(buttonId as ButtonId));
    });
  }
}

/**
 * Specialized command handlers
 */

/**
 * Preset switching command handler
 */
export class PresetSwitchHandler implements ICommandHandler {
  async execute(context: ICommandContext, presetId?: string): Promise<ICommandResult> {
    const { vscode, presetManager } = context;

    try {
      if (!presetId) {
        // Show preset picker
        const presets = [
          { label: 'Core', description: 'Essential formatting tools', value: 'core' },
          { label: 'Writer', description: 'Writing-focused with TOC and advanced formatting', value: 'writer' },
          { label: 'Pro', description: 'Professional suite with linting and enhanced previews', value: 'pro' },
          { label: 'Custom', description: 'Custom button selection', value: 'custom' }
        ];

        const selected = await vscode.window.showQuickPick(presets, {
          placeHolder: 'Select a preset',
          title: 'Markdown Toolbar Preset'
        });

        if (!selected) {
          return { success: false, message: 'No preset selected' };
        }

        presetId = selected.value;
      }

      await presetManager.switchPreset(presetId as any);

      return {
        success: true,
        message: `Switched to ${presetId} preset`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to switch preset'
      };
    }
  }
}

/**
 * Custom button configuration handler
 */
export class CustomizeButtonsHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode, presetManager } = context;

    try {
      const availableButtons = Object.values(BUTTON_DEFINITIONS).map(button => ({
        label: button.title,
        description: button.tooltip,
        value: button.id,
        picked: false // Will be set based on current selection
      }));

      const currentButtons = presetManager.getCustomButtons();
      availableButtons.forEach((item: any) => {
        item.picked = currentButtons.includes(item.value as ButtonId);
      });

      const selected: any = await vscode.window.showQuickPick(availableButtons, {
        placeHolder: 'Select buttons for custom preset',
        title: 'Customize Toolbar Buttons',
        canPickMany: true
      });

      if (!selected) {
        return { success: false, message: 'No buttons selected' };
      }

      const buttonIds = selected.map((item: any) => item.value) as ButtonId[];
      await presetManager.setCustomButtons(buttonIds);

      return {
        success: true,
        message: `Custom preset updated with ${buttonIds.length} buttons`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to customize buttons'
      };
    }
  }
}

/**
 * Debug/analyze dependencies command handler
 */
export class AnalyzeDependenciesHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode, dependencyDetector, presetManager, contextService } = context;

    try {
      const dependencyState = dependencyDetector.getCurrentState();
      const currentPreset = presetManager.getCurrentPreset();
      const effectiveButtons = presetManager.getEffectiveButtons();
      const cacheStats = contextService.getCacheStats();

      const report = [
        '# Markdown Toolbar Dependency Analysis',
        '',
        '## Extension Dependencies',
        `- Markdown All in One: ${dependencyState.hasMAIO ? '✅ Active' : '❌ Not available'}`,
        `- markdownlint: ${dependencyState.hasMarkdownlint ? '✅ Active' : '❌ Not available'}`,
        `- Paste Image: ${dependencyState.hasPasteImage ? '✅ Active' : '❌ Not available'}`,
        `- Markdown Preview Enhanced: ${dependencyState.hasMPE ? '✅ Active' : '❌ Not available'}`,
        '',
        '## Current Configuration',
        `- Active Preset: ${currentPreset.name} (${currentPreset.id})`,
        `- Available Buttons: ${effectiveButtons.length}/${currentPreset.buttons.length}`,
        `- Cache Status: ${cacheStats.isCacheValid ? 'Valid' : 'Invalid'} (age: ${cacheStats.cacheAge}ms)`,
        '',
        '## Available Buttons',
        ...effectiveButtons.map(buttonId => {
          const button = BUTTON_DEFINITIONS[buttonId];
          const status = button.requiresExtension
            ? (dependencyDetector.isExtensionAvailable(button.requiresExtension) ? '✅' : '⚠️')
            : '✅';
          return `- ${status} ${button.title} (${button.id})`;
        }),
        '',
        '## Extension Details',
        ...Object.entries(dependencyState.extensions).map(([extId, info]) => [
          `### ${info.displayName || extId}`,
          `- ID: ${extId}`,
          `- Installed: ${info.isInstalled ? 'Yes' : 'No'}`,
          `- Active: ${info.isActive ? 'Yes' : 'No'}`,
          `- Version: ${info.version || 'Unknown'}`,
          `- Commands: ${info.commands?.length || 0}`,
          ''
        ]).flat()
      ].join('\n');

      // Open report in new untitled document
      const document = await vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(document);

      return {
        success: true,
        message: 'Dependency analysis report generated'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze dependencies'
      };
    }
  }
}

// Register specialized handlers
CommandFactory.registerHandler('mdToolbar.switchPreset', new PresetSwitchHandler());
CommandFactory.registerHandler('mdToolbar.customizeButtons', new CustomizeButtonsHandler());
CommandFactory.registerHandler('mdToolbar.debug.analyzeDependencies', new AnalyzeDependenciesHandler());