import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyDetector } from '../../../src/deps/DependencyDetector';
import { EXTENSION_IDS, IDependencyState, IExtensionInfo } from '../../../src/types/Dependencies';

describe('DependencyDetector', () => {
  let detector: DependencyDetector;
  let mockVscode: any;
  let mockExtensions: Map<string, any>;

  beforeEach(() => {
    mockExtensions = new Map();

    mockVscode = {
      extensions: {
        getExtension: vi.fn((id: string) => mockExtensions.get(id)),
        onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() })
      },
      commands: {
        executeCommand: vi.fn().mockResolvedValue(undefined)
      }
    };

    detector = new DependencyDetector(mockVscode);
  });

  describe('Extension Detection', () => {
    it('should detect installed and active MAIO extension', () => {
      // Arrange
      mockExtensions.set(EXTENSION_IDS.MAIO, {
        id: EXTENSION_IDS.MAIO,
        packageJSON: { displayName: 'Markdown All in One', version: '3.5.1' },
        isActive: true
      });

      // Act
      const extensionInfo = detector.detectExtension(EXTENSION_IDS.MAIO);

      // Assert
      expect(extensionInfo).toEqual({
        id: EXTENSION_IDS.MAIO,
        name: 'yzhang-markdown-all-in-one',
        displayName: 'Markdown All in One',
        isInstalled: true,
        isActive: true,
        isDisabled: false,
        version: '3.5.1',
        commands: expect.any(Array),
        canUseAPI: true
      });
    });

    it('should detect installed but inactive extension', () => {
      // Arrange
      mockExtensions.set(EXTENSION_IDS.MARKDOWNLINT, {
        id: EXTENSION_IDS.MARKDOWNLINT,
        packageJSON: { displayName: 'markdownlint', version: '0.50.0' },
        isActive: false
      });

      // Act  
      const extensionInfo = detector.detectExtension(EXTENSION_IDS.MARKDOWNLINT);

      // Assert
      expect(extensionInfo.isInstalled).toBe(true);
      expect(extensionInfo.isActive).toBe(false);
      expect(extensionInfo.isDisabled).toBe(true);
    });

    it('should handle missing extension', () => {
      // Act
      const extensionInfo = detector.detectExtension('non.existent.extension');

      // Assert
      expect(extensionInfo).toEqual({
        id: 'non.existent.extension',
        name: 'non-existent-extension',
        displayName: 'non.existent.extension',
        isInstalled: false,
        isActive: false,
        isDisabled: false,
        version: undefined,
        commands: [],
        canUseAPI: false
      });
    });
  });

  describe('Dependency State Management', () => {
    it('should return current state with all dependencies', async () => {
      // Arrange - Set up all known extensions
      mockExtensions.set(EXTENSION_IDS.MAIO, {
        id: EXTENSION_IDS.MAIO,
        packageJSON: { displayName: 'MAIO' },
        isActive: true
      });
      mockExtensions.set(EXTENSION_IDS.PASTE_IMAGE, {
        id: EXTENSION_IDS.PASTE_IMAGE,
        packageJSON: { displayName: 'Paste Image' },
        isActive: true
      });

      // Act
      const state = await detector.getCurrentState();

      // Assert
      expect(state).toEqual({
        hasMAIO: true,
        hasMarkdownlint: false,
        hasPasteImage: true,
        hasMPE: false,
        extensions: expect.objectContaining({
          [EXTENSION_IDS.MAIO]: expect.objectContaining({
            isInstalled: true,
            isActive: true
          }),
          [EXTENSION_IDS.PASTE_IMAGE]: expect.objectContaining({
            isInstalled: true,
            isActive: true
          })
        }),
        lastUpdated: expect.any(Number)
      });
    });

    it('should cache state for performance', async () => {
      // Arrange
      const cacheTimeout = 1000; // 1 second
      detector = new DependencyDetector(mockVscode, { cacheTimeout });

      // Act - Call twice quickly
      const state1 = await detector.getCurrentState();
      const state2 = await detector.getCurrentState();

      // Assert - Should use cache (same timestamp)
      expect(state1.lastUpdated).toBe(state2.lastUpdated);
      expect(mockVscode.extensions.getExtension).toHaveBeenCalledTimes(4); // Once for each extension
    });

    it('should refresh cache when timeout expires', async () => {
      // Arrange  
      const cacheTimeout = 50; // 50ms
      detector = new DependencyDetector(mockVscode, { cacheTimeout });

      // Act
      const state1 = await detector.getCurrentState();

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      const state2 = await detector.getCurrentState();

      // Assert
      expect(state2.lastUpdated).toBeGreaterThan(state1.lastUpdated);
    });
  });

  describe('Context Key Management', () => {
    it('should set context keys based on dependency state', async () => {
      // Arrange
      mockExtensions.set(EXTENSION_IDS.MAIO, {
        id: EXTENSION_IDS.MAIO,
        packageJSON: {},
        isActive: true
      });

      // Act
      await detector.getCurrentState(); // This should trigger context key updates

      // Assert - Context keys should be set via the context manager
      // The actual calls might be batched, so we just verify commands were executed
      expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'mdToolbar.hasMAIO',
        true
      );
    });

    it('should update context keys when state changes', async () => {
      // Arrange - Initially no extensions
      const initialState = await detector.getCurrentState();
      vi.clearAllMocks();

      // Act - Add an extension
      mockExtensions.set(EXTENSION_IDS.MPE, {
        id: EXTENSION_IDS.MPE,
        packageJSON: {},
        isActive: true
      });

      // Force refresh
      detector.refresh();

      // Assert - Should update the changed key
      expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'mdToolbar.hasMPE',
        true
      );
    });
  });

  describe('Extension Change Events', () => {
    it('should listen for extension changes', () => {
      // Arrange
      const changeCallback = vi.fn();

      // Act
      const disposable = detector.onDidChangeExtensions(changeCallback);

      // Assert
      expect(mockVscode.extensions.onDidChange).toHaveBeenCalled();
      expect(disposable).toHaveProperty('dispose');
    });

    it('should emit change events when extensions are added', async () => {
      // Arrange
      const changeCallback = vi.fn();
      detector.onDidChangeExtensions(changeCallback);

      const initialState = await detector.getCurrentState();

      // Simulate VS Code extension change event
      const onChangeCallback = mockVscode.extensions.onDidChange.mock.calls[0][0];

      // Act - Add extension and trigger change
      mockExtensions.set(EXTENSION_IDS.MAIO, {
        id: EXTENSION_IDS.MAIO,
        packageJSON: {},
        isActive: true
      });

      onChangeCallback(); // Simulate VS Code firing the change event

      // Assert
      expect(changeCallback).toHaveBeenCalledWith({
        extensionId: EXTENSION_IDS.MAIO,
        changeType: 'installed',
        previousState: expect.objectContaining({
          hasMAIO: false
        }),
        currentState: expect.objectContaining({
          hasMAIO: true
        }),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Utility Methods', () => {
    it('should check if extension is available', () => {
      // Arrange
      mockExtensions.set(EXTENSION_IDS.MAIO, {
        id: EXTENSION_IDS.MAIO,
        packageJSON: {},
        isActive: true
      });

      // Act & Assert
      expect(detector.isExtensionAvailable(EXTENSION_IDS.MAIO)).toBe(true);
      expect(detector.isExtensionAvailable(EXTENSION_IDS.MARKDOWNLINT)).toBe(false);
    });

    it('should dispose resources properly', () => {
      // Arrange
      const mockDisposable = { dispose: vi.fn() };
      mockVscode.extensions.onDidChange.mockReturnValue(mockDisposable);

      // Create a new detector to trigger the constructor logic
      const newDetector = new DependencyDetector(mockVscode);

      // Act
      newDetector.dispose();

      // Assert
      expect(mockDisposable.dispose).toHaveBeenCalled();
    });
  });
});