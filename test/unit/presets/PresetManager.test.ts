import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresetManager } from '../../../src/presets/PresetManager';
import { PRESET_DEFINITIONS, BUTTON_DEFINITIONS, ButtonId, PresetId } from '../../../src/types/Buttons';
import { IDependencyState } from '../../../src/types/Dependencies';

describe('PresetManager', () => {
  let presetManager: PresetManager;
  let mockVscode: any;
  let mockConfig: any;
  let mockDependencyDetector: any;
  let mockDependencyState: IDependencyState;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string, defaultValue?: any) => {
        // Return default value if no specific mock is set
        return defaultValue;
      }),
      update: vi.fn().mockResolvedValue(undefined),
      has: vi.fn(),
      inspect: vi.fn()
    };

    mockVscode = {
      workspace: {
        getConfiguration: vi.fn().mockReturnValue(mockConfig),
        onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
      },
      commands: {
        executeCommand: vi.fn().mockResolvedValue(undefined)
      },
      ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
    };

    mockDependencyState = {
      hasMAIO: false,
      hasMarkdownlint: false,
      hasPasteImage: false,
      hasMPE: false,
      extensions: {},
      lastUpdated: Date.now()
    };

    mockDependencyDetector = {
      getCurrentState: vi.fn().mockReturnValue(mockDependencyState),
      onDidChangeExtensions: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      isExtensionAvailable: vi.fn().mockReturnValue(false)
    };

    presetManager = new PresetManager(mockVscode, mockDependencyDetector);
  });

  describe('Preset Detection', () => {
    it('should return Core preset by default', () => {
      // Arrange - mockConfig already returns defaultValue, which is 'core'
      // No need to change mock setup

      // Act
      const currentPreset = presetManager.getCurrentPreset();

      // Assert
      expect(currentPreset.id).toBe('core');
      expect(currentPreset.name).toBe('Core');
      expect(currentPreset.buttons).toEqual(PRESET_DEFINITIONS.core.buttons);
    });

    it('should return configured preset from settings', () => {
      // Arrange - Create a fresh preset manager with specific config
      const testMockConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'preset') return 'writer';
          if (key === 'custom.visibleButtons') return [];
          return defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn()
      };

      const testMockVscode = {
        workspace: {
          getConfiguration: vi.fn().mockReturnValue(testMockConfig),
          onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
        },
        commands: {
          executeCommand: vi.fn().mockResolvedValue(undefined)
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
      };

      const testPresetManager = new PresetManager(testMockVscode, mockDependencyDetector);

      // Act
      const currentPreset = testPresetManager.getCurrentPreset();

      // Assert
      expect(currentPreset.id).toBe('writer');
      expect(currentPreset.name).toBe('Writer');
      expect(currentPreset.buttons).toEqual(PRESET_DEFINITIONS.writer.buttons);
    });

    it('should handle invalid preset setting gracefully', () => {
      // Arrange
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'preset') return 'invalid-preset';
        return undefined;
      });

      // Act
      const currentPreset = presetManager.getCurrentPreset();

      // Assert - Should fallback to core
      expect(currentPreset.id).toBe('core');
    });

    it('should return custom preset with user-defined buttons', () => {
      // Arrange
      const customButtons: ButtonId[] = ['fmt.bold', 'fmt.italic', 'toc.create'];
      
      const testMockConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'preset') return 'custom';
          if (key === 'custom.visibleButtons') return customButtons;
          return defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn()
      };

      const testMockVscode = {
        workspace: {
          getConfiguration: vi.fn().mockReturnValue(testMockConfig),
          onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
        },
        commands: {
          executeCommand: vi.fn().mockResolvedValue(undefined)
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
      };

      const testPresetManager = new PresetManager(testMockVscode, mockDependencyDetector);

      // Act
      const currentPreset = testPresetManager.getCurrentPreset();

      // Assert
      expect(currentPreset.id).toBe('custom');
      expect(currentPreset.buttons).toEqual(customButtons);
    });
  });

  describe('Effective Button Filtering', () => {
    it('should return all buttons when all extensions are available', async () => {
      // Arrange - Create a fresh preset manager with Pro preset and all extensions available
      const testMockConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'preset') return 'pro';
          if (key === 'custom.visibleButtons') return [];
          return defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn()
      };

      const testMockVscode = {
        workspace: {
          getConfiguration: vi.fn().mockReturnValue(testMockConfig),
          onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
        },
        commands: {
          executeCommand: vi.fn().mockResolvedValue(undefined)
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
      };

      const testMockDependencyDetector = {
        getCurrentState: vi.fn().mockReturnValue({
          hasMAIO: true,
          hasMarkdownlint: true,
          hasPasteImage: true,
          hasMPE: true,
          extensions: {},
          lastUpdated: Date.now()
        }),
        onDidChangeExtensions: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        isExtensionAvailable: vi.fn().mockReturnValue(true)
      };

      const testPresetManager = new PresetManager(testMockVscode, testMockDependencyDetector);

      // Act
      const effectiveButtons = await testPresetManager.getEffectiveButtons();

      // Assert - Should include all Pro preset buttons
      const expectedButtons = PRESET_DEFINITIONS.pro.buttons;
      expect(effectiveButtons).toEqual(expectedButtons);
    });

    it('should filter out buttons requiring missing extensions', async () => {
      // Arrange - Create a fresh preset manager with Pro preset and only MAIO available
      const testMockConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'preset') return 'pro';
          if (key === 'custom.visibleButtons') return [];
          return defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn()
      };

      const testMockVscode = {
        workspace: {
          getConfiguration: vi.fn().mockReturnValue(testMockConfig),
          onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
        },
        commands: {
          executeCommand: vi.fn().mockResolvedValue(undefined)
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
      };

      const testMockDependencyDetector = {
        getCurrentState: vi.fn().mockReturnValue({
          hasMAIO: true,
          hasMarkdownlint: false,
          hasPasteImage: false,
          hasMPE: false,
          extensions: {},
          lastUpdated: Date.now()
        }),
        onDidChangeExtensions: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        isExtensionAvailable: vi.fn().mockImplementation((extId: string) => {
          return extId === 'yzhang.markdown-all-in-one';
        })
      };

      const testPresetManager = new PresetManager(testMockVscode, testMockDependencyDetector);

      // Act
      const effectiveButtons = await testPresetManager.getEffectiveButtons();

      // Assert - Should exclude markdownlint and MPE buttons
      expect(effectiveButtons).not.toContain('lint.fix');
      expect(effectiveButtons).not.toContain('lint.workspace');
      expect(effectiveButtons).not.toContain('preview.mpe.side');
      expect(effectiveButtons).toContain('toc.create'); // Should include MAIO buttons
    });

    it('should handle custom preset with dependency filtering', async () => {
      // Arrange
      const customButtons: ButtonId[] = [
        'preview.side',    // No dependency
        'toc.create',      // Requires MAIO (not available)
        'lint.fix',        // Requires markdownlint (not available)  
        'image.paste'      // Requires paste-image (not available)
      ];

      const testMockConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'preset') return 'custom';
          if (key === 'custom.visibleButtons') return customButtons;
          return defaultValue;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn()
      };

      const testMockVscode = {
        workspace: {
          getConfiguration: vi.fn().mockReturnValue(testMockConfig),
          onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
        },
        commands: {
          executeCommand: vi.fn().mockResolvedValue(undefined)
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
      };

      const testMockDependencyDetector = {
        getCurrentState: vi.fn().mockReturnValue({
          hasMAIO: false,
          hasMarkdownlint: false,
          hasPasteImage: false,
          hasMPE: false,
          extensions: {},
          lastUpdated: Date.now()
        }),
        onDidChangeExtensions: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        isExtensionAvailable: vi.fn().mockReturnValue(false)
      };

      const testPresetManager = new PresetManager(testMockVscode, testMockDependencyDetector);

      // Act
      const effectiveButtons = await testPresetManager.getEffectiveButtons();

      // Assert - Should only include buttons without dependencies
      expect(effectiveButtons).toEqual(['preview.side']);
    });
  });

  describe('Preset Switching', () => {
    it('should switch preset and persist to settings', async () => {
      // Act
      await presetManager.switchPreset('writer');

      // Assert
      expect(mockConfig.update).toHaveBeenCalledWith(
        'preset',
        'writer', 
        mockVscode.ConfigurationTarget.Global
      );
      expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'mdToolbar.preset',
        'writer'
      );
    });

    it('should emit preset change event', async () => {
      // Arrange
      const changeCallback = vi.fn();
      presetManager.onDidChangePreset(changeCallback);

      // Act
      await presetManager.switchPreset('pro');

      // Assert
      expect(changeCallback).toHaveBeenCalledWith({
        previousPreset: 'core', // Default
        currentPreset: 'pro',
        triggeredBy: 'user',
        availableButtons: expect.any(Array),
        timestamp: expect.any(Number)
      });
    });

    it('should handle switch to invalid preset', async () => {
      // Act & Assert - Should not throw
      await expect(presetManager.switchPreset('invalid' as PresetId)).resolves.toBeUndefined();
      
      // Should not update settings for invalid preset
      expect(mockConfig.update).not.toHaveBeenCalled();
    });
  });

  describe('Custom Button Management', () => {
    it('should get current custom buttons', () => {
      // Arrange
      const customButtons: ButtonId[] = ['fmt.bold', 'list.toggle', 'code.inline'];
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'custom.visibleButtons') return customButtons;
        return undefined;
      });

      // Act
      const buttons = presetManager.getCustomButtons();

      // Assert
      expect(buttons).toEqual(customButtons);
    });

    it('should return empty array when no custom buttons set', () => {
      // Arrange
      mockConfig.get.mockImplementation(() => undefined);

      // Act
      const buttons = presetManager.getCustomButtons();

      // Assert
      expect(buttons).toEqual([]);
    });

    it('should set custom buttons and persist to settings', async () => {
      // Arrange
      const newButtons: ButtonId[] = ['fmt.bold', 'fmt.italic', 'preview.side'];

      // Act
      await presetManager.setCustomButtons(newButtons);

      // Assert
      expect(mockConfig.update).toHaveBeenCalledWith(
        'custom.visibleButtons',
        newButtons,
        mockVscode.ConfigurationTarget.Global
      );
    });

    it('should validate custom buttons and filter invalid ones', async () => {
      // Arrange
      const buttonsWithInvalid = [
        'fmt.bold',
        'invalid.button' as ButtonId,  
        'fmt.italic',
        'another.invalid' as ButtonId
      ];

      // Act
      await presetManager.setCustomButtons(buttonsWithInvalid);

      // Assert - Should only persist valid buttons
      expect(mockConfig.update).toHaveBeenCalledWith(
        'custom.visibleButtons',
        ['fmt.bold', 'fmt.italic'],
        mockVscode.ConfigurationTarget.Global
      );
    });
  });

  describe('Auto-Switching Logic', () => {
    it('should suggest upgrade when new extensions become available', async () => {
      // Arrange - Start with Core preset and no extensions
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'preset') return 'core';
        return undefined;
      });

      const presetChangeCallback = vi.fn();
      presetManager.onDidChangePreset(presetChangeCallback);

      // Simulate dependency change: MAIO installed
      const depChangeCallback = mockDependencyDetector.onDidChangeExtensions.mock.calls[0][0];

      // Act - Simulate MAIO installation
      mockDependencyState.hasMAIO = true;
      mockDependencyDetector.isExtensionAvailable.mockImplementation((extId: string) => 
        extId === 'yzhang.markdown-all-in-one'
      );

      await depChangeCallback({
        extensionId: 'yzhang.markdown-all-in-one',
        changeType: 'installed',
        previousState: { hasMAIO: false },
        currentState: { hasMAIO: true },
        timestamp: Date.now()
      });

      // Assert - Should suggest upgrade to Writer
      expect(presetChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedPreset: 'writer',
          reason: 'extension-installed'
        })
      );
    });

    it('should handle extension removal gracefully', async () => {
      // Arrange - Start with Writer preset and MAIO available
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'preset') return 'writer';
        return undefined;
      });
      
      mockDependencyState.hasMAIO = false; // Extension removed
      mockDependencyDetector.isExtensionAvailable.mockReturnValue(false);

      // Act - Get effective buttons after removal
      const effectiveButtons = presetManager.getEffectiveButtons();

      // Assert - Should filter out MAIO-dependent buttons
      expect(effectiveButtons).not.toContain('toc.create');
      expect(effectiveButtons).not.toContain('toc.update');
    });
  });

  describe('Configuration Change Handling', () => {
    it('should listen for configuration changes', () => {
      // Assert - Should register configuration listener
      expect(mockVscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });

    it('should emit events when configuration changes', () => {
      // Arrange
      const changeCallback = vi.fn();
      presetManager.onDidChangePreset(changeCallback);
      
      // Set up a different preset for the configuration change
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'preset') return 'writer'; // Change from default 'core'
        return defaultValue;
      });

      // Simulate configuration change
      const configChangeCallback = mockVscode.workspace.onDidChangeConfiguration.mock.calls[0][0];

      // Act
      configChangeCallback({
        affectsConfiguration: vi.fn().mockReturnValue(true)
      });

      // Assert
      expect(changeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          previousPreset: 'core',
          currentPreset: 'writer',
          triggeredBy: 'config'
        })
      );
    });
  });

  describe('Resource Management', () => {
    it('should dispose all resources properly', () => {
      // Arrange
      const mockDisposable = { dispose: vi.fn() };
      mockVscode.workspace.onDidChangeConfiguration.mockReturnValue(mockDisposable);
      mockDependencyDetector.onDidChangeExtensions.mockReturnValue(mockDisposable);

      const newManager = new PresetManager(mockVscode, mockDependencyDetector);

      // Act
      newManager.dispose();

      // Assert
      expect(mockDisposable.dispose).toHaveBeenCalledTimes(2); // Config + dependency listeners
    });
  });
});