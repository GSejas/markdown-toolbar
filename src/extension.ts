/**
 * @moduleName: VS Code Markdown Toolbar Extension - Main Entry Point
 * @version: 2.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Context-aware markdown formatting toolbar for VS Code status bar with smart toggle functionality
 * @techStack: TypeScript, VS Code Extension API, Node.js
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ./deps/DependencyDetector, ./services/ContextService, ./commands/CommandFactory, ./engine/ContextDetector
 * @requirementsTraceability:
 *   {@link Requirements.REQ_CORE_001} (Extension Lifecycle Management)
 *   {@link Requirements.REQ_CORE_002} (Service Initialization)
 *   {@link Requirements.REQ_CORE_003} (Command Registration)
 *   {@link Requirements.REQ_CORE_004} (Event Handling)
 * @briefDescription: Main extension entry point managing the complete lifecycle of the markdown toolbar extension. Coordinates service initialization, command registration, and event handling while providing graceful error handling and user feedback
 * @methods: activate, deactivate, initializeCoreServices, initializeCommands, setupEventListeners, showWelcomeMessage
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Extension activation: Automatic on markdown file open
 *   - Service coordination: DependencyDetector → ContextService → CommandFactory
 *   - Error handling: Graceful degradation with user notifications
 * @vulnerabilitiesAssessment: Extension sandboxing, input validation, proper resource disposal, no external network access
 */

import * as vscode from 'vscode';

// Core services
import { DependencyDetector } from './deps/DependencyDetector';
import { PresetManager } from './presets/PresetManager';
import { ContextService } from './services/ContextService';
import { ContextKeyManager } from './services/ContextKeyManager';

// Command system
import { CommandFactory, ICommandContext } from './commands/CommandFactory';
import { FallbackCommands } from './commands/FallbackCommands';

// Engine and utilities
import { ContextDetector } from './engine/ContextDetector';
import { BUTTON_DEFINITIONS } from './types/Buttons';
import { CONFIG_KEYS } from './constants/configKeys';

// UI Components
import { StatusBarToolbar } from './ui/StatusBarToolbar';
import { ConfigurationGenerator } from './ui/ConfigurationGenerator';

/**
 * Extension state management with complete system integration
 */
class ExtensionState {
	// Core services
	private dependencyDetector: DependencyDetector | undefined;
	private presetManager: PresetManager | undefined;
	private contextService: ContextService | undefined;
	private contextKeyManager: ContextKeyManager | undefined;

	// Command system
	private fallbackCommands: FallbackCommands | undefined;
	private commandContext: ICommandContext | undefined;

	// UI Components
	private toolbar: StatusBarToolbar | undefined;
	private configGenerator: ConfigurationGenerator | undefined;

	// Disposables
	private disposables: vscode.Disposable[] = [];

	public async activate(context: vscode.ExtensionContext): Promise<void> {
		try {
			console.log('Activating Markdown Toolbar extension v2.0...');

			// Initialize core services
			await this.initializeCoreServices();

			// Initialize command system
			this.initializeCommands(context);

			// Set up event listeners
			this.setupEventListeners();

			// Add disposables to context
			context.subscriptions.push(
				{
					dispose: () => this.deactivate()
				}
			);

			console.log('Markdown Toolbar extension activated successfully!');

			// Show welcome message for first-time users
			await this.showWelcomeMessage();

		} catch (error) {
			console.error('Failed to activate Markdown Toolbar extension:', error);
			vscode.window.showErrorMessage(`Failed to activate Markdown Toolbar: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	public deactivate(): void {
		try {
			console.log('Deactivating Markdown Toolbar extension...');

			// Dispose all services
			this.contextService?.dispose();
			this.presetManager?.dispose();
			this.dependencyDetector?.dispose();
			this.contextKeyManager?.dispose();

			// Dispose all event listeners
			this.disposables.forEach(disposable => {
				try {
					disposable.dispose();
				} catch (error) {
					console.warn('Error disposing resource:', error);
				}
			});

			this.disposables = [];

			console.log('Markdown Toolbar extension deactivated successfully!');

		} catch (error) {
			console.error('Error during extension deactivation:', error);
		}
	}

	/**
	 * Initialize all core services
	 */
	private async initializeCoreServices(): Promise<void> {
		// Initialize context key manager
		this.contextKeyManager = new ContextKeyManager();

		// Initialize dependency detector
		this.dependencyDetector = new DependencyDetector(
			vscode,
			{
				cacheTimeout: 30000,
				autoDetectChanges: true
			},
			this.contextKeyManager
		);

		// Initialize preset manager
		this.presetManager = new PresetManager(vscode, this.dependencyDetector);

		// Initialize context detector and service
		const contextDetector = new ContextDetector();
		const config = vscode.workspace.getConfiguration(CONFIG_KEYS.root);

		this.contextService = new ContextService(
			vscode,
			contextDetector,
			{
				debounceTimeout: config.get('contextUpdateDebounce', 100),
				cacheTimeout: 1000,
				enableCaching: true
			}
		);

		// Set up command context
		this.commandContext = {
			vscode,
			dependencyDetector: this.dependencyDetector,
			presetManager: this.presetManager,
			contextService: this.contextService,
			fallbackBehavior: config.get('fallbackBehavior', 'internal')
		};

		// Force initial dependency detection
		await this.dependencyDetector.refresh();

		console.log('Core services initialized');
	}

	/**
	 * Initialize command system
	 */
	private initializeCommands(context: vscode.ExtensionContext): void {
		// Initialize fallback commands
		this.fallbackCommands = new FallbackCommands(vscode);
		this.fallbackCommands.registerAll(context);

		// Register all button command handlers
		CommandFactory.registerAllButtonHandlers();

		// Register all commands with VS Code
		Object.values(BUTTON_DEFINITIONS).forEach(button => {
			const handler = CommandFactory.getHandler(button.commandId);
			if (handler) {
				const disposable = vscode.commands.registerCommand(button.commandId, async (...args) => {
					if (!this.commandContext) {
						console.error('Command context not initialized');
						return;
					}

					try {
						const result = await handler.execute(this.commandContext, ...args);

						if (!result.success && result.message) {
							if (result.extensionRequired) {
								// Show extension-specific error
								const action = await vscode.window.showWarningMessage(
									result.message,
									'Install Extension'
								);

								if (action === 'Install Extension') {
									await vscode.commands.executeCommand(
										'workbench.extensions.installExtension',
										result.extensionRequired
									);
								}
							} else {
								vscode.window.showWarningMessage(result.message);
							}
						}

						if (result.fallbackUsed) {
							console.log(`Used fallback for command ${button.commandId}`);
						}
					} catch (error) {
						console.error(`Error executing command ${button.commandId}:`, error);
						vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}
				});

				this.disposables.push(disposable);
			}
		});

		// Register utility commands
		const utilityCommands = [
			'mdToolbar.switchPreset',
			'mdToolbar.customizeButtons',
			'mdToolbar.debug.analyzeDependencies'
		];

		utilityCommands.forEach(commandId => {
			const handler = CommandFactory.getHandler(commandId);
			if (handler) {
				const disposable = vscode.commands.registerCommand(commandId, async (...args) => {
					if (!this.commandContext) {
						console.error('Command context not initialized');
						return;
					}

					try {
						const result = await handler.execute(this.commandContext, ...args);

						if (result.success && result.message) {
							vscode.window.showInformationMessage(result.message);
						} else if (!result.success && result.message) {
							vscode.window.showErrorMessage(result.message);
						}
					} catch (error) {
						console.error(`Error executing command ${commandId}:`, error);
						vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}
				});

				this.disposables.push(disposable);
			}
		});

		console.log(`Registered ${this.disposables.length} commands`);
	}

	/**
	 * Set up event listeners
	 */
	private setupEventListeners(): void {
		if (!this.presetManager || !this.dependencyDetector || !this.contextService) {
			throw new Error('Services not initialized');
		}

		// Listen for preset changes
		const presetDisposable = this.presetManager.onDidChangePreset(async (event) => {
			console.log(`Preset changed from ${event.previousPreset} to ${event.currentPreset}`);

			if (event.suggestedPreset) {
				// Auto-switching suggestion
				const action = await vscode.window.showInformationMessage(
					`New extension detected! Would you like to upgrade to the ${event.suggestedPreset} preset?`,
					'Upgrade',
					'Not Now'
				);

				if (action === 'Upgrade') {
					await this.presetManager!.switchPreset(event.suggestedPreset);
				}
			}
		});

		// Listen for dependency changes
		const depDisposable = this.dependencyDetector.onDidChangeExtensions((event) => {
			console.log(`Extension ${event.extensionId} was ${event.changeType}`);
		});

		// Listen for context changes
		const contextDisposable = this.contextService.onDidChangeContext((event) => {
			console.log(`Document context changed: ${event.changedProperties.join(', ')}`);
		});

		this.disposables.push(presetDisposable, depDisposable, contextDisposable);
	}

	/**
	 * Show welcome message for first-time users
	 */
	private async showWelcomeMessage(): Promise<void> {
		const config = vscode.workspace.getConfiguration(CONFIG_KEYS.root);
		const hasShownWelcome = config.get('_internal.hasShownWelcome', false);

		if (!hasShownWelcome) {
			const action = await vscode.window.showInformationMessage(
				'Welcome to Markdown Toolbar v2.0! Choose your preset to get started.',
				'Choose Preset',
				'Later'
			);

			if (action === 'Choose Preset') {
				await vscode.commands.executeCommand('mdToolbar.switchPreset');
			}

			// Mark as shown
			await config.update('_internal.hasShownWelcome', true, vscode.ConfigurationTarget.Global);
		}
	}

	// Getters for testing
	public getDependencyDetector(): DependencyDetector | undefined {
		return this.dependencyDetector;
	}

	public getPresetManager(): PresetManager | undefined {
		return this.presetManager;
	}

	public getContextService(): ContextService | undefined {
		return this.contextService;
	}
}

// Global extension state
const extensionState = new ExtensionState();

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time a markdown file is opened
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	await extensionState.activate(context);
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate(): void {
	extensionState.deactivate();
}

/**
 * Exported for testing purposes
 */
export function getExtensionState(): {
	dependencyDetector: DependencyDetector | undefined;
	presetManager: PresetManager | undefined;
	contextService: ContextService | undefined;
} {
	return {
		dependencyDetector: extensionState.getDependencyDetector(),
		presetManager: extensionState.getPresetManager(),
		contextService: extensionState.getContextService()
	};
}

// Export types for external usage
export type { IPresetManager } from './presets/PresetManager';
export type { IDependencyDetector } from './types/Dependencies';
export type { ButtonId, PresetId } from './types/Buttons';
