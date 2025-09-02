import { describe, it, expect, beforeEach, vi } from 'vitest';
// Import the SettingsAdapter and use dependency injection for vscode in tests
import { SettingsAdapter } from '../../../src/settings/SettingsAdapter';

// We'll create a manual mock for the vscode workspace.getConfiguration in tests
describe('SettingsAdapter', () => {
  let settings: any;
  let mockConfig: any;
  let mockVscode: any;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined)
    };

    mockVscode = {
      workspace: {
        getConfiguration: vi.fn().mockReturnValue(mockConfig),
        onDidChangeConfiguration: vi.fn()
      },
      ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3
      },
      window: {
        showErrorMessage: vi.fn()
      }
    };

    settings = new SettingsAdapter(mockVscode as any);
  });

  describe('isToolbarEnabled', () => {
    it('should return default value when setting is undefined', () => {
      mockConfig.get.mockReturnValue(undefined);
      const result = settings.isToolbarEnabled();
      expect(result).toBe(true); // Default value
      expect(mockConfig.get).toHaveBeenCalledWith('enabled', true);
    });

    it('should return configured value when setting exists', () => {
      mockConfig.get.mockReturnValue(false);
      const result = settings.isToolbarEnabled();
      expect(result).toBe(false);
    });
  });

  describe('getToolbarPosition', () => {
    it('should return default position when setting is undefined', () => {
      mockConfig.get.mockReturnValue(undefined);
      const result = settings.getToolbarPosition();
      expect(result).toBe('right');
    });

    it('should return left when configured', () => {
      mockConfig.get.mockReturnValue('left');
      const result = settings.getToolbarPosition();
      expect(result).toBe('left');
    });

    it('should default to right for invalid values', () => {
      mockConfig.get.mockReturnValue('invalid');
      const result = settings.getToolbarPosition();
      expect(result).toBe('right');
    });
  });

  describe('getActiveButtons', () => {
    it('should return default buttons when setting is undefined', () => {
      mockConfig.get.mockReturnValue(undefined);
      const result = settings.getActiveButtons();
      expect(result).toEqual(['bold', 'italic', 'code', 'link', 'list']);
    });

    it('should return configured buttons', () => {
      mockConfig.get.mockReturnValue(['bold', 'italic', 'link']);
      const result = settings.getActiveButtons();
      expect(result).toEqual(['bold', 'italic', 'link']);
    });

    it('should handle empty array', () => {
      mockConfig.get.mockReturnValue([]);
      const result = settings.getActiveButtons();
      expect(result).toEqual([]);
    });
  });

  describe('getConfiguration', () => {
    it('should return complete configuration object', () => {
      mockConfig.get
        .mockReturnValueOnce(true)    // enabled
        .mockReturnValueOnce('left')  // position
        .mockReturnValueOnce(['bold', 'italic']); // buttons

      const result = settings.getConfiguration();
      expect(result).toEqual({
        enabled: true,
        position: 'left',
        buttons: ['bold', 'italic']
      });
    });
  });

  describe('updateConfiguration', () => {
    it('should update configuration value', async () => {
      await settings.updateConfiguration('enabled', false);
      expect(mockConfig.update).toHaveBeenCalledWith('enabled', false, expect.any(Number));
    });

    it('should handle different configuration targets', async () => {
  await settings.updateConfiguration('position', 'left', mockVscode.ConfigurationTarget.Global);
  expect(mockConfig.update).toHaveBeenCalledWith('position', 'left', mockVscode.ConfigurationTarget.Global);
    });
  });

  describe('isValidButton', () => {
    it('should validate known button names', () => {
      expect(settings.isValidButton('bold')).toBe(true);
      expect(settings.isValidButton('italic')).toBe(true);
      expect(settings.isValidButton('code')).toBe(true);
      expect(settings.isValidButton('link')).toBe(true);
      expect(settings.isValidButton('list')).toBe(true);
    });

    it('should reject unknown button names', () => {
      expect(settings.isValidButton('unknown')).toBe(false);
      expect(settings.isValidButton('invalid')).toBe(false);
      expect(settings.isValidButton('')).toBe(false);
    });
  });

  describe('onConfigurationChanged', () => {
    it('should register configuration change listener', () => {
      const callback = vi.fn();
      const mockDisposable = { dispose: vi.fn() };

      // Configure the mocked onDidChangeConfiguration to return a disposable
      const mockOnDidChange = vi.fn().mockReturnValue(mockDisposable);
      mockVscode.workspace.onDidChangeConfiguration = mockOnDidChange;

      // Create a new adapter to ensure it uses the mocked vscode
      const localSettings = new SettingsAdapter(mockVscode as any);

      const disposable = localSettings.onConfigurationChanged(callback);

      expect(mockOnDidChange).toHaveBeenCalled();
      expect(disposable).toBe(mockDisposable);
    });
  });
});
