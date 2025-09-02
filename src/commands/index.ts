import * as vscode from 'vscode';
import { MarkdownFormatter } from '../engine/MarkdownFormatter';
import { ContextDetector } from '../engine/ContextDetector';

/**
 * Shared context interface for markdown commands
 */
export interface ICommandContext {
  formatter: MarkdownFormatter;
  detector: ContextDetector;
  getActiveEditor(): vscode.TextEditor | undefined;
  executeEdit(editFunction: (editBuilder: vscode.TextEditorEdit) => void): Promise<boolean>;
  showInputBox(options: vscode.InputBoxOptions): Promise<string | undefined>;
  showErrorMessage(message: string): void;
}

/**
 * Command factory function type
 */
export type CommandFactory = (context: ICommandContext) => vscode.Disposable;

/**
 * Command registry for managing markdown toolbar commands
 */
export class CommandRegistry {
  private context: ICommandContext;
  private registeredCommands: vscode.Disposable[] = [];

  constructor() {
    this.context = this.createCommandContext();
  }

  /**
   * Creates the shared command context
   */
  private createCommandContext(): ICommandContext {
    const formatter = new MarkdownFormatter();
    const detector = new ContextDetector();

    return {
      formatter,
      detector,
      
      getActiveEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
      },

      async executeEdit(editFunction: (editBuilder: vscode.TextEditorEdit) => void): Promise<boolean> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return false;
        }
        
        return await editor.edit(editFunction);
      },

      async showInputBox(options: vscode.InputBoxOptions): Promise<string | undefined> {
        return await vscode.window.showInputBox(options);
      },

      showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
      }
    };
  }

  /**
   * Registers a command with the given factory function
   * @param commandId Command identifier
   * @param factory Function that creates the command
   */
  public registerCommand(commandId: string, factory: CommandFactory): void {
    try {
      const disposable = factory(this.context);
      this.registeredCommands.push(disposable);
    } catch (error) {
      console.error(`Failed to register command ${commandId}:`, error);
      this.context.showErrorMessage(`Failed to register command: ${commandId}`);
    }
  }

  /**
   * Registers multiple commands at once
   * @param commands Object mapping command IDs to factory functions
   */
  public registerCommands(commands: Record<string, CommandFactory>): void {
    Object.entries(commands).forEach(([commandId, factory]) => {
      this.registerCommand(commandId, factory);
    });
  }

  /**
   * Disposes all registered commands
   */
  public dispose(): void {
    this.registeredCommands.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('Error disposing command:', error);
      }
    });
    this.registeredCommands = [];
  }

  /**
   * Gets the shared command context
   */
  public getContext(): ICommandContext {
    return this.context;
  }
}
