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

import { ButtonId, PresetId, IButtonDefinition, BUTTON_DEFINITIONS } from '../types/Buttons';
import { IDependencyDetector } from '../types/Dependencies';
import { IPresetManager } from '../presets/PresetManager';
import { ContextService } from '../services/ContextService';
import { logger } from '../services/Logger';

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

    logger.info(`[CommandFactory] Executing button command: ${buttonDef.id}`);
    logger.info(`[CommandFactory] Command ID: ${buttonDef.commandId}`);
    logger.info(`[CommandFactory] Delegates to: ${buttonDef.delegatesTo || 'none'}`);
    logger.info(`[CommandFactory] Fallback command: ${buttonDef.fallbackCommand || 'none'}`);
    logger.info(`[CommandFactory] Arguments:`, args);

    try {
      // Check if extension is required and available
      if (buttonDef.requiresExtension) {
        const isAvailable = dependencyDetector.isExtensionAvailable(buttonDef.requiresExtension);
        logger.info(`[CommandFactory] Extension ${buttonDef.requiresExtension} available: ${isAvailable}`);

        if (!isAvailable) {
          return this.handleMissingExtension(buttonDef, context);
        }
      }

      // Try to delegate to external command first
      if (buttonDef.delegatesTo) {
        logger.info(`[CommandFactory] Attempting to delegate to: ${buttonDef.delegatesTo}`);
        try {
          await vscode.commands.executeCommand(buttonDef.delegatesTo, ...args);
          logger.info(`[CommandFactory] Successfully executed delegated command: ${buttonDef.delegatesTo}`);
          return { success: true };
        } catch (error) {
          logger.warn(`Failed to execute delegated command ${buttonDef.delegatesTo}:`, error instanceof Error ? error.message : String(error));

          // Fall back to internal implementation if available
          if (buttonDef.fallbackCommand) {
            logger.info(`[CommandFactory] Attempting fallback command: ${buttonDef.fallbackCommand}`);
            try {
              await vscode.commands.executeCommand(buttonDef.fallbackCommand, ...args);
              logger.info(`[CommandFactory] Successfully executed fallback command: ${buttonDef.fallbackCommand}`);
              return { success: true, fallbackUsed: true };
            } catch (fallbackError) {
              logger.error(`Failed to execute fallback command ${buttonDef.fallbackCommand}:`, fallbackError);
              return {
                success: false,
                message: `Both primary and fallback commands failed: ${error instanceof Error ? error.message : String(error)}`
              };
            }
          }
        }
      }

      // No delegate available. Prefer internal fallback instead of re-invoking the same command (avoids recursion).
      if (buttonDef.fallbackCommand) {
        logger.info(`[CommandFactory] No delegate found. Executing fallback command: ${buttonDef.fallbackCommand}`);
        await vscode.commands.executeCommand(buttonDef.fallbackCommand, ...args);
        logger.info(`[CommandFactory] Successfully executed fallback command: ${buttonDef.fallbackCommand}`);
        return { success: true, fallbackUsed: true };
      }

      // As a safety, do NOT call the same commandId here; it would re-enter this handler and loop.
      logger.warn(
        `[CommandFactory] No delegate or fallback for ${buttonDef.id} (${buttonDef.commandId}). Skipping self-invocation to avoid recursion.`
      );
      return { success: false, message: `No delegate or fallback available for ${buttonDef.id}` };

    } catch (error) {
      logger.error(`Error executing command for button ${buttonDef.id}:`, error);
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
   * Clear all registered handlers (useful for tests to reset state)
   */
  public static clearHandlers(): void {
    this.handlers.clear();
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
          title: 'Markdown Extended Toolbar Preset'
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
      const dependencyState = await dependencyDetector.getCurrentState();
      const currentPreset = presetManager.getCurrentPreset();
      const effectiveButtons = await presetManager.getEffectiveButtons();
      const cacheStats = contextService.getCacheStats();

      const report = [
        '# Markdown Extended Toolbar Dependency Analysis',
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

/**
 * Extended command handlers for markdown features
 */

/**
 * Footnote command handler
 */
export class FootnoteHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode } = context;
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document.languageId !== 'markdown') {
      return { success: false, message: 'Active markdown editor required' };
    }

    try {
      const document = editor.document;
      const text = document.getText();

      // Find the next footnote number
      const footnoteMatches = text.match(/\[\^(\d+)\]/g) || [];
      const numbers = footnoteMatches.map((match: string) => parseInt(match.match(/\d+/)![0], 10));
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

      const footnoteRef = `[^${nextNumber}]`;

      await editor.edit((editBuilder: any) => {
        // Access selection inside edit callback to avoid cloning issues
        const selection = editor.selection;
        // Insert footnote reference at cursor
        editBuilder.replace(selection, footnoteRef);

        // Add footnote definition at end of document
        const lastLine = document.lineAt(document.lineCount - 1);
        const insertPosition = lastLine.range.end;
        editBuilder.insert(insertPosition, `\n\n[^${nextNumber}]: `);
      });

      // Move cursor to footnote definition
      const newLastLine = editor.document.lineAt(editor.document.lineCount - 1);
      const endPosition = newLastLine.range.end;
      editor.selection = new vscode.Selection(endPosition, endPosition);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to insert footnote'
      };
    }
  }
}

/**
 * Inline math command handler
 */
export class MathInlineHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode } = context;
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document.languageId !== 'markdown') {
      return { success: false, message: 'Active markdown editor required' };
    }

    try {
      await editor.edit((editBuilder: any) => {
        // Access selection inside edit callback to avoid cloning issues
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (text.startsWith('$') && text.endsWith('$') && text.length > 2) {
          // Remove math
          editBuilder.replace(selection, text.slice(1, -1));
        } else {
          // Add math
          editBuilder.replace(selection, `$${text}$`);
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle inline math'
      };
    }
  }
}

/**
 * Math block command handler
 */
export class MathBlockHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode } = context;
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document.languageId !== 'markdown') {
      return { success: false, message: 'Active markdown editor required' };
    }

    try {
      let textWasEmpty = false;
      let originalSelection: any;

      await editor.edit((editBuilder: any) => {
        // Access selection inside edit callback to avoid cloning issues
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        textWasEmpty = !text.trim();
        originalSelection = selection;

        const mathBlock = text.trim()
          ? `\n$$\n${text}\n$$\n`
          : `\n$$\n\n$$\n`;

        editBuilder.replace(selection, mathBlock);
      });

      // Position cursor inside math block if it was empty
      if (textWasEmpty && originalSelection) {
        const newPosition = originalSelection.start.translate(2, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to insert math block'
      };
    }
  }
}

/**
 * Horizontal rule command handler
 */
export class HorizontalRuleHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode } = context;
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document.languageId !== 'markdown') {
      return { success: false, message: 'Active markdown editor required' };
    }

    try {
      await editor.edit((editBuilder: any) => {
        // Access selection inside the edit callback to avoid cloning issues
        const selection = editor.selection;
        editBuilder.replace(selection, '\n---\n');
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to insert horizontal rule'
      };
    }
  }
}

/**
 * Line break command handler
 */
export class LineBreakHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    const { vscode } = context;
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document.languageId !== 'markdown') {
      return { success: false, message: 'Active markdown editor required' };
    }

    try {
      await editor.edit((editBuilder: any) => {
        // Access selection inside edit callback to avoid cloning issues
        const selection = editor.selection;
        editBuilder.replace(selection, '  \n');
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to insert line break'
      };
    }
  }
}

// Register specialized handlers
CommandFactory.registerHandler('mdToolbar.switchPreset', new PresetSwitchHandler());
CommandFactory.registerHandler('mdToolbar.customizeButtons', new CustomizeButtonsHandler());
CommandFactory.registerHandler('mdToolbar.debug.analyzeDependencies', new AnalyzeDependenciesHandler());

// Register extended command handlers
CommandFactory.registerHandler('mdToolbar.footnote.insert', new FootnoteHandler());
CommandFactory.registerHandler('mdToolbar.math.inline', new MathInlineHandler());
CommandFactory.registerHandler('mdToolbar.math.block', new MathBlockHandler());
CommandFactory.registerHandler('mdToolbar.hr.insert', new HorizontalRuleHandler());
CommandFactory.registerHandler('mdToolbar.break.line', new LineBreakHandler());

/**
 * Table command handlers
 */
export class TableAddRowHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, tableStartLine: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const tableProvider = new (await import('../providers/tableCodeLensProvider')).TableCodeLensProvider();
      await tableProvider.addRowToTable(document, tableStartLine);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add table row'
      };
    }
  }
}

export class TableAddColumnHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, tableStartLine: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const tableProvider = new (await import('../providers/tableCodeLensProvider')).TableCodeLensProvider();
      await tableProvider.addColumnToTable(document, tableStartLine);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add table column'
      };
    }
  }
}

export class TableFormatHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, tableStartLine: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const tableProvider = new (await import('../providers/tableCodeLensProvider')).TableCodeLensProvider();
      await tableProvider.formatTable(document, tableStartLine);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to format table'
      };
    }
  }
}


export class TableRemoveRowHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, tableStartLine: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const tableProvider = new (await import('../providers/tableCodeLensProvider')).TableCodeLensProvider();
      // TODO: Implement removeRowFromTable method in TableCodeLensProvider
      context.vscode.window.showInformationMessage('Remove row not yet implemented');
      return { success: true, message: 'Remove row feature coming soon' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove table row'
      };
    }
  }
}

// Legacy header command handlers removed - functionality moved to CodeLens providers

export class HeaderCopyLinkHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, lineNumber: number, anchor: string): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const headerProvider = new (await import('../providers/headerCodeLensProvider')).HeaderCodeLensProvider(new (await import('../engine/DocumentCache')).DocumentCache());
      await headerProvider.copyHeaderLink(document, lineNumber, anchor);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to copy header link'
      };
    }
  }
}

export class PresetCycleHandler implements ICommandHandler {
  async execute(context: ICommandContext): Promise<ICommandResult> {
    try {
      // Define the test preset order for cycling
      const testPresetOrder: PresetId[] = [
        'test-minimal',
        'test-student',
        'test-blogger',
        'test-developer',
        'test-researcher',
        'test-presenter',
        'test-qa',
        'test-mobile',
        'test-power',
        'test-accessibility',
        'core', // Back to core preset
        'writer',
        'pro'
      ];

      const currentPreset = context.presetManager?.getCurrentPreset();
      const currentIndex = testPresetOrder.indexOf(currentPreset?.id || 'core');
      const nextIndex = (currentIndex + 1) % testPresetOrder.length;
      const nextPreset = testPresetOrder[nextIndex];

      await context.presetManager?.switchPreset(nextPreset);

      return {
        success: true,
        message: `Switched to ${nextPreset} preset (${nextIndex + 1}/${testPresetOrder.length})`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cycle presets'
      };
    }
  }
}

// Register table command handlers
CommandFactory.registerHandler('mdToolbar.table.addRow', new TableAddRowHandler());
CommandFactory.registerHandler('mdToolbar.table.addColumn', new TableAddColumnHandler());
CommandFactory.registerHandler('mdToolbar.table.format', new TableFormatHandler());
CommandFactory.registerHandler('mdToolbar.table.removeRow', new TableRemoveRowHandler());

// Legacy header command handlers removed - these are not used by CodeLens providers

// Register preset cycling handler  
CommandFactory.registerHandler('mdToolbar.debug.cyclePreset', new PresetCycleHandler());

// Register additional header commands for CodeLens providers
export class HeaderMoveUpHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, lineNumber: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const headerProvider = new (await import('../providers/headerCodeLensProvider')).HeaderCodeLensProvider(new (await import('../engine/DocumentCache')).DocumentCache());
      await headerProvider.moveHeaderUp(document, lineNumber);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to move header up'
      };
    }
  }
}

export class HeaderMoveDownHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, lineNumber: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const headerProvider = new (await import('../providers/headerCodeLensProvider')).HeaderCodeLensProvider(new (await import('../engine/DocumentCache')).DocumentCache());
      await headerProvider.moveHeaderDown(document, lineNumber);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to move header down'
      };
    }
  }
}

export class HeaderFoldSectionHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, lineNumber: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const headerProvider = new (await import('../providers/headerCodeLensProvider')).HeaderCodeLensProvider(new (await import('../engine/DocumentCache')).DocumentCache());
      await headerProvider.foldSection(document, lineNumber);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fold section'
      };
    }
  }
}

export class HeaderCopySectionHandler implements ICommandHandler {
  async execute(context: ICommandContext, uri: any, lineNumber: number): Promise<ICommandResult> {
    try {
      const document = await context.vscode.workspace.openTextDocument(uri);
      const headerProvider = new (await import('../providers/headerCodeLensProvider')).HeaderCodeLensProvider(new (await import('../engine/DocumentCache')).DocumentCache());
      await headerProvider.copyHeaderSection(document, lineNumber);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to copy section'
      };
    }
  }
}

export class CodeBlockCopyHandler implements ICommandHandler {
  async execute(context: ICommandContext, content: string, language: string): Promise<ICommandResult> {
    try {
      await context.vscode.env.clipboard.writeText(content.trim());
      context.vscode.window.showInformationMessage(`Copied ${language} code block to clipboard`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to copy code block'
      };
    }
  }
}

// Register header CodeLens commands
CommandFactory.registerHandler('mdToolbar.header.moveUp', new HeaderMoveUpHandler());
CommandFactory.registerHandler('mdToolbar.header.moveDown', new HeaderMoveDownHandler());
CommandFactory.registerHandler('mdToolbar.header.copyLink', new HeaderCopyLinkHandler());
CommandFactory.registerHandler('mdToolbar.header.copySection', new HeaderCopySectionHandler());
CommandFactory.registerHandler('mdToolbar.header.foldSection', new HeaderFoldSectionHandler());

// Register code block commands
CommandFactory.registerHandler('mdToolbar.codeblock.copy', new CodeBlockCopyHandler());