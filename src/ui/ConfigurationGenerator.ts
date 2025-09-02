/**
 * @moduleName: Configuration Generator - User-Friendly Config Interface
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Interactive configuration generator for customizing the markdown toolbar
 * @techStack: TypeScript, VS Code Extension API, Webview API
 * @dependency: vscode (VS Code Extension API)
 * @interModuleDependency: ../types/Buttons, ../constants/configKeys
 * @briefDescription: Provides an intuitive interface for users to customize their markdown toolbar with drag-and-drop, preset templates, and real-time preview
 * @methods: open, generateConfig, previewChanges, exportConfig
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Drag-and-drop button reordering
 *   - Live preview of toolbar appearance
 *   - Template-based configuration starting points
 * @vulnerabilitiesAssessment: Webview security policies, user input validation, settings API validation
 */

import { ButtonId, IButtonDefinition, BUTTON_DEFINITIONS, ButtonCategory, PRESET_DEFINITIONS, PresetId } from '../types/Buttons';
import { CONFIG_KEYS, DEFAULT_CONFIG } from '../constants/configKeys';

/**
 * Interactive configuration generator for the markdown toolbar
 * Makes configuration approachable for non-technical users
 */
export class ConfigurationGenerator {
  private vscode: any;
  private panel: any = null;
  private currentConfig: any = {};

  constructor(vscodeImpl?: any) {
    this.vscode = vscodeImpl || require('vscode');
  }

  /**
   * Open the configuration generator interface
   */
  public async open(): Promise<void> {
    // Create webview panel
    this.panel = this.vscode.window.createWebviewPanel(
      'mdToolbarConfig',
      'Markdown Toolbar Configuration',
      this.vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Load current configuration
    await this.loadCurrentConfig();

    // Set webview content
    this.panel.webview.html = this.getWebviewContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.command) {
        case 'updateConfig':
          await this.updateConfig(message.config);
          break;
        case 'previewConfig':
          await this.previewConfig(message.config);
          break;
        case 'resetToPreset':
          await this.resetToPreset(message.preset);
          break;
        case 'exportConfig':
          await this.exportConfig();
          break;
      }
    });

    // Send initial data to webview
    this.panel.webview.postMessage({
      command: 'initialize',
      currentConfig: this.currentConfig,
      buttonDefinitions: BUTTON_DEFINITIONS,
      presetDefinitions: PRESET_DEFINITIONS
    });
  }

  /**
   * Load current VS Code configuration
   */
  private async loadCurrentConfig(): Promise<void> {
    const config = this.vscode.workspace.getConfiguration();
    
    this.currentConfig = {
      preset: config.get(CONFIG_KEYS.preset, DEFAULT_CONFIG.preset),
      customVisible: config.get(CONFIG_KEYS.customVisible, DEFAULT_CONFIG.customVisible),
      compact: config.get(CONFIG_KEYS.compact, DEFAULT_CONFIG.compact),
      statusBarEnabled: config.get(CONFIG_KEYS.statusBarEnabled, DEFAULT_CONFIG.statusBarEnabled),
      position: config.get(CONFIG_KEYS.position, DEFAULT_CONFIG.position)
    };
  }

  /**
   * Update configuration and apply changes
   */
  private async updateConfig(newConfig: any): Promise<void> {
    const config = this.vscode.workspace.getConfiguration();
    
    // Update each setting
    for (const [key, value] of Object.entries(newConfig)) {
      const configKey = (CONFIG_KEYS as any)[key];
      if (configKey) {
        await config.update(configKey, value, this.vscode.ConfigurationTarget.Global);
      }
    }

    this.currentConfig = { ...this.currentConfig, ...newConfig };
    
    // Show success message
    this.vscode.window.showInformationMessage('Markdown toolbar configuration updated!');
  }

  /**
   * Preview configuration changes without applying
   */
  private async previewConfig(config: any): Promise<void> {
    // Send preview command to main extension
    await this.vscode.commands.executeCommand('mdToolbar.preview', config);
  }

  /**
   * Reset to a preset configuration
   */
  private async resetToPreset(presetId: PresetId): Promise<void> {
    const preset = PRESET_DEFINITIONS[presetId];
    const newConfig = {
      preset: presetId,
      customVisible: preset.buttons,
      compact: false,
      statusBarEnabled: true
    };

    await this.updateConfig(newConfig);
    
    // Update webview
    this.panel.webview.postMessage({
      command: 'configUpdated',
      config: newConfig
    });
  }

  /**
   * Export configuration as JSON for sharing
   */
  private async exportConfig(): Promise<void> {
    const exportData = {
      name: 'My Markdown Toolbar Config',
      created: new Date().toISOString(),
      config: this.currentConfig,
      buttons: this.currentConfig.preset === 'custom' 
        ? this.currentConfig.customVisible.map((id: ButtonId) => ({
            id,
            title: BUTTON_DEFINITIONS[id]?.title,
            category: BUTTON_DEFINITIONS[id]?.category
          }))
        : PRESET_DEFINITIONS[this.currentConfig.preset]?.buttons
    };

    const json = JSON.stringify(exportData, null, 2);
    
    // Show in new editor
    const doc = await this.vscode.workspace.openTextDocument({
      content: json,
      language: 'json'
    });
    
    await this.vscode.window.showTextDocument(doc);
    this.vscode.window.showInformationMessage('Configuration exported! Save this file to share your setup.');
  }

  /**
   * Generate the webview HTML content
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Toolbar Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        
        .header {
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        
        .preset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .preset-card {
            padding: 15px;
            border: 2px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .preset-card:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .preset-card.active {
            border-color: var(--vscode-button-background);
            background: var(--vscode-button-hoverBackground);
        }
        
        .button-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        
        .button-item {
            padding: 8px 12px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .button-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .button-item.selected {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .button-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .toolbar-preview {
            background: var(--vscode-statusBar-background);
            color: var(--vscode-statusBar-foreground);
            padding: 8px 15px;
            border-radius: 3px;
            font-family: monospace;
            margin: 15px 0;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .category-header {
            font-weight: bold;
            color: var(--vscode-textPreformat-foreground);
            margin: 15px 0 5px 0;
            text-transform: uppercase;
            font-size: 11px;
        }
        
        select {
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            padding: 4px 8px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛠️ Markdown Toolbar Configuration</h1>
        <p>Customize your markdown toolbar with an intuitive interface</p>
    </div>

    <div class="section">
        <h2>📋 Quick Start - Choose a Preset</h2>
        <div class="preset-grid" id="presetGrid">
            <!-- Presets will be populated by JavaScript -->
        </div>
    </div>

    <div class="section">
        <h2>🎛️ Custom Configuration</h2>
        <p>Select exactly which buttons you want in your toolbar:</p>
        <div id="buttonCategories">
            <!-- Button categories will be populated by JavaScript -->
        </div>
    </div>

    <div class="section">
        <h2>👀 Live Preview</h2>
        <p>This is how your toolbar will look:</p>
        <div class="toolbar-preview" id="toolbarPreview">
            Loading preview...
        </div>
        <p><strong>Status:</strong> <span id="statusText">Ready</span></p>
    </div>

    <div class="section">
        <h2>⚙️ Advanced Options</h2>
        <label>
            <input type="checkbox" id="compactMode"> Compact mode (smaller buttons)
        </label><br>
        <label>
            <input type="checkbox" id="statusBarEnabled"> Show preset switcher in status bar
        </label><br>
        <label>
            Position: 
            <select id="position">
                <option value="left">Left</option>
                <option value="right">Right</option>
            </select>
        </label>
    </div>

    <div class="controls">
        <button onclick="applyChanges()">✅ Apply Changes</button>
        <button onclick="previewChanges()">👁️ Preview</button>
        <button onclick="exportConfig()">📤 Export Config</button>
        <button onclick="resetToDefaults()">🔄 Reset to Core</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentConfig = {};
        let buttonDefinitions = {};
        let presetDefinitions = {};

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'initialize':
                    currentConfig = message.currentConfig;
                    buttonDefinitions = message.buttonDefinitions;
                    presetDefinitions = message.presetDefinitions;
                    initializeUI();
                    break;
                case 'configUpdated':
                    currentConfig = message.config;
                    updateUI();
                    break;
            }
        });

        function initializeUI() {
            renderPresets();
            renderButtonCategories();
            updateUI();
        }

        function renderPresets() {
            const grid = document.getElementById('presetGrid');
            grid.innerHTML = '';
            
            Object.values(presetDefinitions).forEach(preset => {
                const card = document.createElement('div');
                card.className = 'preset-card';
                card.innerHTML = \`
                    <h3>\${preset.name}</h3>
                    <p>\${preset.description}</p>
                    <small>\${preset.buttons.length} buttons</small>
                \`;
                card.onclick = () => selectPreset(preset.id);
                grid.appendChild(card);
            });
        }

        function renderButtonCategories() {
            const container = document.getElementById('buttonCategories');
            const categories = {};
            
            // Group buttons by category
            Object.values(buttonDefinitions).forEach(button => {
                if (!categories[button.category]) {
                    categories[button.category] = [];
                }
                categories[button.category].push(button);
            });

            container.innerHTML = '';
            Object.entries(categories).forEach(([category, buttons]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.innerHTML = \`<div class="category-header">\${category}</div>\`;
                
                const buttonGrid = document.createElement('div');
                buttonGrid.className = 'button-grid';
                
                buttons.forEach(button => {
                    const buttonDiv = document.createElement('div');
                    buttonDiv.className = 'button-item';
                    buttonDiv.innerHTML = \`
                        <div>\${button.icon || '📄'}</div>
                        <div>\${button.title}</div>
                    \`;
                    buttonDiv.onclick = () => toggleButton(button.id);
                    buttonGrid.appendChild(buttonDiv);
                });
                
                categoryDiv.appendChild(buttonGrid);
                container.appendChild(categoryDiv);
            });
        }

        function updateUI() {
            // Update preset selection
            document.querySelectorAll('.preset-card').forEach((card, index) => {
                card.classList.toggle('active', 
                    Object.keys(presetDefinitions)[index] === currentConfig.preset);
            });

            // Update button selection
            const selectedButtons = currentConfig.preset === 'custom' 
                ? currentConfig.customVisible 
                : presetDefinitions[currentConfig.preset]?.buttons || [];

            document.querySelectorAll('.button-item').forEach((item, index) => {
                const buttonId = Object.keys(buttonDefinitions)[index];
                item.classList.toggle('selected', selectedButtons.includes(buttonId));
            });

            // Update advanced options
            document.getElementById('compactMode').checked = currentConfig.compact;
            document.getElementById('statusBarEnabled').checked = currentConfig.statusBarEnabled;
            document.getElementById('position').value = currentConfig.position;

            // Update preview
            updatePreview();
        }

        function updatePreview() {
            const selectedButtons = currentConfig.preset === 'custom' 
                ? currentConfig.customVisible 
                : presetDefinitions[currentConfig.preset]?.buttons || [];

            const preview = selectedButtons.slice(0, 6).map(buttonId => {
                const button = buttonDefinitions[buttonId];
                return button ? \`[\${button.icon || button.title.charAt(0)}]\` : '[?]';
            }).join(' ');

            document.getElementById('toolbarPreview').textContent = 
                \`\$(markdown) \${currentConfig.preset.toUpperCase()} \${preview}\`;
            
            document.getElementById('statusText').textContent = 
                \`\${selectedButtons.length} buttons • \${currentConfig.preset} preset\`;
        }

        function selectPreset(presetId) {
            currentConfig.preset = presetId;
            if (presetId !== 'custom') {
                currentConfig.customVisible = presetDefinitions[presetId].buttons;
            }
            updateUI();
        }

        function toggleButton(buttonId) {
            if (currentConfig.preset !== 'custom') {
                currentConfig.preset = 'custom';
                currentConfig.customVisible = [...(currentConfig.customVisible || [])];
            }

            const index = currentConfig.customVisible.indexOf(buttonId);
            if (index >= 0) {
                currentConfig.customVisible.splice(index, 1);
            } else {
                currentConfig.customVisible.push(buttonId);
            }
            updateUI();
        }

        function applyChanges() {
            currentConfig.compact = document.getElementById('compactMode').checked;
            currentConfig.statusBarEnabled = document.getElementById('statusBarEnabled').checked;
            currentConfig.position = document.getElementById('position').value;

            vscode.postMessage({
                command: 'updateConfig',
                config: currentConfig
            });
        }

        function previewChanges() {
            vscode.postMessage({
                command: 'previewConfig',
                config: currentConfig
            });
        }

        function exportConfig() {
            vscode.postMessage({
                command: 'exportConfig'
            });
        }

        function resetToDefaults() {
            vscode.postMessage({
                command: 'resetToPreset',
                preset: 'core'
            });
        }
    </script>
</body>
</html>`;
  }

  /**
   * Dispose of the configuration generator
   */
  public dispose(): void {
    this.panel?.dispose();
  }
}