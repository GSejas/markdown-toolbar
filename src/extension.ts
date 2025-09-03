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
 *
 * @lessonsLearned:
 *   - Service initialization order critical for proper dependency resolution
 *   - Event listener cleanup prevents memory leaks in long-running sessions
 *   - Graceful error handling improves user experience during extension failures
 *   - Context-aware initialization reduces startup time and resource usage
 *
 * @futureConsiderations:
 *   - Implement lazy loading for non-essential services
 *   - Add telemetry for performance monitoring and usage analytics
 *   - Consider plugin architecture for third-party extension integration
 *   - Implement A/B testing framework for feature validation
 *
 * @developmentNotes:
 *   - Maintain service initialization order in activate() method
 *   - Update JSDoc headers when making breaking changes
 *   - Test extension lifecycle events thoroughly
 *   - Document service dependencies clearly
 *
 * @documentReviewStatus:
 *   - [ ] Code functionality matches JSDoc specifications
 *   - [ ] All dependencies properly documented and versioned
 *   - [ ] Error handling covers all failure scenarios
 *   - [ ] Performance optimizations implemented and tested
 *   - [ ] Security considerations addressed and validated
 *   - [ ] Cross-platform compatibility verified
 *
 * @lastReviewed: 2025-09-02
 * @reviewVersion: v2.0.0
 * @nextReviewDue: 2025-12-02
 */

import * as vscode from 'vscode';
import { logger } from './services/Logger';

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
import { MarkdownFormatter } from './engine/MarkdownFormatter';
import { BUTTON_DEFINITIONS } from './types/Buttons';
import { CONFIG_KEYS } from './constants/configKeys';

// UI Components
import { StatusBarToolbar } from './ui/StatusBarToolbar';
import { StatusBarManager } from './ui/StatusBarManager';
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
	private statusBarManager: StatusBarManager | undefined;
	private configGenerator: ConfigurationGenerator | undefined;

	// Disposables
	private disposables: vscode.Disposable[] = [];

	public async activate(context: vscode.ExtensionContext): Promise<void> {
		try {
			logger.info('Activating Markdown Toolbar extension v2.0...');

			// Initialize core services
			await this.initializeCoreServices();

			// Initialize command system
			this.initializeCommands(context);

			// Set up event listeners
			this.setupEventListeners();

			// Register providers
			logger.info('About to call registerProviders...');
			this.registerProviders(context);
			logger.info('registerProviders call completed');

			// Add disposables to context
			context.subscriptions.push(
				{
					dispose: () => this.deactivate()
				}
			);

			logger.info('Markdown Toolbar extension activated successfully!');

			// Show welcome message for first-time users
			await this.showWelcomeMessage();

		} catch (error) {
			logger.error('Failed to activate Markdown Toolbar extension:', error);
			vscode.window.showErrorMessage(`Failed to activate Markdown Toolbar: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	public deactivate(): void {
		try {
			logger.info('Deactivating Markdown Toolbar extension...');

			// Dispose all services
			this.contextService?.dispose();
			this.presetManager?.dispose();
			this.dependencyDetector?.dispose();
			this.contextKeyManager?.dispose();
			this.statusBarManager?.dispose();
			// Dispose all event listeners
			this.disposables.forEach(disposable => {
				try {
					disposable.dispose();
				} catch (error) {
					logger.warn('Error disposing resource:', error);
				}
			});

			this.disposables = [];

			logger.info('Markdown Toolbar extension deactivated successfully!');

		} catch (error) {
			logger.error('Error during extension deactivation:', error);
		}
	}

	/**
	 * Initialize all core services
	 */
	private async initializeCoreServices(): Promise<void> {
		// Initialize context key manager
		this.contextKeyManager = new ContextKeyManager();

		// Set debug mode context key (detect if running in debug mode)
		const isDebugMode = process.env.VSCODE_DEBUG_MODE === 'true' ||
			vscode.env.sessionId.includes('debug') ||
			vscode.workspace.getConfiguration('mdToolbar').get('debugMode', false);
		await this.contextKeyManager.setContext('mdToolbar.debugMode', isDebugMode);
		logger.info(`Debug mode: ${isDebugMode}`);

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

		// Initialize status bar UI
		this.statusBarManager = new StatusBarManager(this.presetManager);

		logger.debug('Core services initialized');
	}

	/**
	 * Initialize unified command system
	 */
	private initializeCommands(context: vscode.ExtensionContext): void {
		// Initialize fallback commands (internal implementations)
		logger.info('[Extension] Initializing fallback commands...');
		this.fallbackCommands = new FallbackCommands(vscode);
		this.fallbackCommands.registerAll(context);
		logger.info('[Extension] Fallback commands registered');

		// Header commands now handled by CodeLens providers and CommandFactory
		logger.info('[Extension] Header commands handled by CodeLens providers');

		// Register all button command handlers with CommandFactory
		logger.info('[Extension] Registering button command handlers...');
		CommandFactory.registerAllButtonHandlers();
		logger.info('[Extension] Button command handlers registered');

		// Get all command IDs from buttons and utilities
		const buttonCommandIds = Object.values(BUTTON_DEFINITIONS).map(button => button.commandId);
		const utilityCommandIds = [
			'mdToolbar.switchPreset',
			'mdToolbar.customizeButtons',
			'mdToolbar.debug.analyzeDependencies',
			// Header CodeLens commands
			'mdToolbar.header.moveUp',
			'mdToolbar.header.moveDown',
			'mdToolbar.header.copyLink',
			'mdToolbar.header.copySection',
			'mdToolbar.header.foldSection',
			// Code block commands
			'mdToolbar.codeblock.copy',
			// Table CodeLens commands
			'mdToolbar.table.addRow',
			'mdToolbar.table.addColumn',
			'mdToolbar.table.format',
			'mdToolbar.table.sort',
			'mdToolbar.table.align',
			'mdToolbar.table.removeRow'
			// Note: 'mdToolbar.debug.cyclePreset' is registered through BUTTON_DEFINITIONS
		];
		const allCommandIds = [...buttonCommandIds, ...utilityCommandIds];

		// Register all commands with VS Code using unified pattern
		allCommandIds.forEach(commandId => {
			const handler = CommandFactory.getHandler(commandId);
			if (handler) {
				logger.info(`[Extension] Registering command handler for: ${commandId}`);
				const disposable = vscode.commands.registerCommand(commandId, async (...args) => {
					logger.info(`[Extension] Command executed: ${commandId}`);
					logger.info(`[Extension] Command arguments:`, args);

					if (!this.commandContext) {
						logger.warn('[Extension] Command context not initialized');
						return;
					}

					try {
						logger.info(`[Extension] Executing handler for: ${commandId}`);
						const result = await handler.execute(this.commandContext, ...args);
						logger.info(`[Extension] Command result for ${commandId}:`, result);

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
							logger.info(`Used fallback for command ${commandId}`);
						}

						if (result.success && result.message && utilityCommandIds.includes(commandId)) {
							vscode.window.showInformationMessage(result.message);
						}
					} catch (error) {
						logger.error(`Error executing command ${commandId}:`, error);
						vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}
				});

				this.disposables.push(disposable);
			} else {
				logger.warn(`No handler found for command: ${commandId}`);
			}
		});

		logger.info(`Registered ${this.disposables.length - context.subscriptions.length} commands via unified CommandFactory`);
	}

	/**
	 * Register CodeLens and Hover providers with smart dependency detection
	 */
	private registerProviders(context: vscode.ExtensionContext): void {
		logger.info('registerProviders method called - starting provider registration...');
		// Checkbox providers - only if competing extension not installed  
		const hasCheckboxExtension = this.dependencyDetector?.isExtensionAvailable('markdown-checkbox-preview');
		if (!hasCheckboxExtension) {
			import('./providers/checkboxCodeLensProvider').then(({ CheckboxCodeLensProvider }) => {
				const checkboxProvider = new CheckboxCodeLensProvider(context);
				context.subscriptions.push(
					vscode.languages.registerCodeLensProvider({ language: 'markdown' }, checkboxProvider)
				);
				logger.info('Checkbox CodeLens provider registered (no competing extension found)');
			}).catch(err => logger.warn('Failed to load checkbox CodeLens provider:', err));

			import('./providers/checkboxHoverProvider').then((module) => {
				const CheckboxHoverProvider = module.CheckboxHoverProvider || (module as any).default;
				if (CheckboxHoverProvider) {
					const hoverProvider = new CheckboxHoverProvider(context);
					context.subscriptions.push(
						vscode.languages.registerHoverProvider({ language: 'markdown' }, hoverProvider)
					);
					logger.info('Checkbox Hover provider registered (no competing extension found)');
				}
			}).catch(err => logger.warn('Failed to load checkbox Hover provider:', err));
		} else {
			logger.info('Skipping checkbox providers - competing extension detected');
		}

		// Mermaid providers - only if competing extensions not installed
		const hasMermaidPro = this.dependencyDetector?.isExtensionAvailable('mermaid-export-pro');
		const hasMermaidExtension = this.dependencyDetector?.isExtensionAvailable('bierner.markdown-mermaid');

		if (!hasMermaidPro && !hasMermaidExtension) {
			import('./providers/mermaidCodeLensProvider').then((module) => {
				const MermaidCodeLensProvider = module.MermaidCodeLensProvider || (module as any).default;
				if (MermaidCodeLensProvider) {
					const mermaidProvider = new MermaidCodeLensProvider(context);
					context.subscriptions.push(
						vscode.languages.registerCodeLensProvider({ language: 'markdown' }, mermaidProvider)
					);
					logger.info('Mermaid CodeLens provider registered (no competing extension found)');
				}
			}).catch(err => logger.warn('Failed to load mermaid CodeLens provider:', err));

			import('./providers/mermaidHoverProvider').then((module) => {
				// Handle different possible export structures
				const HoverProvider = (module as any).MermaidHoverProvider || (module as any).default;
				if (HoverProvider) {
					const mermaidHoverProvider = new HoverProvider(context);
					context.subscriptions.push(
						vscode.languages.registerHoverProvider({ language: 'markdown' }, mermaidHoverProvider)
					);
					logger.info('Mermaid Hover provider registered (no competing extension found)');
				}
			}).catch(err => logger.warn('Failed to load mermaid Hover provider:', err));
		} else {
			logger.info('Skipping mermaid providers - competing extension detected');
		}

		// Table providers - always register (high user value, no major competing extensions)
		import('./providers/tableCodeLensProvider').then(({ TableCodeLensProvider }) => {
			logger.info('[Extension] Loading TableCodeLensProvider...');
			const tableProvider = new TableCodeLensProvider();
			logger.info('[Extension] TableCodeLensProvider instance created');
			context.subscriptions.push(
				vscode.languages.registerCodeLensProvider({ language: 'markdown' }, tableProvider)
			);
			logger.info('[Extension] Table CodeLens provider registered successfully');
		}).catch(err => {
			logger.error('[Extension] Failed to load table CodeLens provider:', err);
			logger.warn('Failed to load table CodeLens provider:', err);
		});

		// Header providers - always register (navigation is essential)
		logger.info('[Extension] Starting HeaderCodeLensProvider registration...');
		import('./providers/headerCodeLensProvider').then(({ HeaderCodeLensProvider }) => {
			logger.info('[Extension] HeaderCodeLensProvider import successful, creating instance...');
			const headerProvider = new HeaderCodeLensProvider();
			logger.info('[Extension] HeaderCodeLensProvider instance created, registering with VS Code...');
			const providerDisposable = vscode.languages.registerCodeLensProvider({ language: 'markdown' }, headerProvider);
			context.subscriptions.push(providerDisposable);
			logger.info('[Extension] Header CodeLens provider registered successfully with VS Code');
			logger.info('[Extension] Provider disposable added to subscriptions');
		}).catch(err => {
			logger.error('[Extension] Failed to load header CodeLens provider:', err);
			logger.error('[Extension] Error details:', err.message, err.stack);
		});

		logger.info('Provider registration completed with smart dependency detection');
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
			logger.info(`Preset changed from ${event.previousPreset} to ${event.currentPreset}`);

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
			logger.debug(`Extension ${event.extensionId} was ${event.changeType}`);
		});

		// Listen for context changes
		const contextDisposable = this.contextService.onDidChangeContext((event) => {
			logger.debug(`Document context changed: ${event.changedProperties.join(', ')}`);
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
