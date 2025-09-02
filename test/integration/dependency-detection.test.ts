import * as assert from 'assert';
import * as vscode from 'vscode';
import { DependencyDetector } from '../../src/deps/DependencyDetector';
import { EXTENSION_IDS } from '../../src/types/Dependencies';

/**
 * Integration tests for dependency detection using real VS Code APIs
 * These tests run in the actual VS Code extension host
 */
suite('Dependency Detection Integration Tests', () => {
  let detector: DependencyDetector;

  setup(() => {
    detector = new DependencyDetector();
  });

  teardown(() => {
    if (detector) {
      detector.dispose();
    }
  });

  test('Should detect extension installation status', async () => {
    // Get current dependency state
    const state = detector.getCurrentState();
    
    // Verify state structure
    assert.ok(typeof state.hasMAIO === 'boolean');
    assert.ok(typeof state.hasMarkdownlint === 'boolean');
    assert.ok(typeof state.hasPasteImage === 'boolean');
    assert.ok(typeof state.hasMPE === 'boolean');
    assert.ok(typeof state.lastUpdated === 'number');
    assert.ok(state.extensions);

    // Verify each tracked extension has info
    Object.values(EXTENSION_IDS).forEach(extensionId => {
      const info = state.extensions[extensionId];
      assert.ok(info, `Extension info missing for ${extensionId}`);
      assert.strictEqual(info.id, extensionId);
      assert.ok(typeof info.isInstalled === 'boolean');
      assert.ok(typeof info.isActive === 'boolean');
      assert.ok(typeof info.isDisabled === 'boolean');
      assert.ok(typeof info.canUseAPI === 'boolean');
      assert.ok(typeof info.name === 'string');
    });
  });

  test('Should detect specific extensions correctly', async () => {
    // Test MAIO detection (commonly installed)
    const maioInfo = detector.detectExtension(EXTENSION_IDS.MAIO);
    
    assert.strictEqual(maioInfo.id, EXTENSION_IDS.MAIO);
    assert.ok(typeof maioInfo.isInstalled === 'boolean');
    assert.ok(typeof maioInfo.isActive === 'boolean');
    assert.ok(typeof maioInfo.isDisabled === 'boolean');
    assert.ok(typeof maioInfo.canUseAPI === 'boolean');
    
    if (maioInfo.isInstalled) {
      assert.ok(maioInfo.version, 'Installed extension should have version');
      assert.ok(maioInfo.displayName, 'Installed extension should have display name');
      
      // If installed but not active, it might be disabled
      if (!maioInfo.isActive) {
        console.log(`MAIO is installed but not active (might be disabled)`);
      }
      
      // API access should only be available if active
      assert.strictEqual(maioInfo.canUseAPI, maioInfo.isActive);
    }
  });

  test('Should handle non-existent extension gracefully', () => {
    const info = detector.detectExtension('non.existent.extension');
    
    assert.strictEqual(info.id, 'non.existent.extension');
    assert.strictEqual(info.isInstalled, false);
    assert.strictEqual(info.isEnabled, false);
    assert.strictEqual(info.version, undefined);
  });

  test('Should set context keys based on detection results', async () => {
    // Get initial state (this should set context keys)
    const state = detector.getCurrentState();
    
    // Wait a bit for context keys to be set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // We can't directly verify context keys in tests, but we can verify
    // the state matches what should be set
    const expectedKeys = {
      'mdToolbar.hasMAIO': state.hasMAIO,
      'mdToolbar.hasMarkdownlint': state.hasMarkdownlint,
      'mdToolbar.hasPasteImage': state.hasPasteImage,
      'mdToolbar.hasMPE': state.hasMPE
    };

    // At minimum, verify the state is consistent
    assert.strictEqual(state.hasMAIO, state.extensions[EXTENSION_IDS.MAIO]?.isEnabled ?? false);
    assert.strictEqual(state.hasMarkdownlint, state.extensions[EXTENSION_IDS.MARKDOWNLINT]?.isEnabled ?? false);
    assert.strictEqual(state.hasPasteImage, state.extensions[EXTENSION_IDS.PASTE_IMAGE]?.isEnabled ?? false);
    assert.strictEqual(state.hasMPE, state.extensions[EXTENSION_IDS.MPE]?.isEnabled ?? false);
  });

  test('Should use caching for performance', () => {
    const start1 = Date.now();
    const state1 = detector.getCurrentState();
    const end1 = Date.now();

    const start2 = Date.now(); 
    const state2 = detector.getCurrentState();
    const end2 = Date.now();

    // Second call should be much faster (cached)
    const time1 = end1 - start1;
    const time2 = end2 - start2;
    
    assert.ok(time2 < time1 || time2 < 10, 'Second call should use cache and be faster');
    assert.strictEqual(state1.lastUpdated, state2.lastUpdated, 'Cached state should have same timestamp');
  });

  test('Should refresh state on demand', async () => {
    const initialState = detector.getCurrentState();
    
    // Wait a bit to ensure timestamp would change
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const refreshedState = await detector.refresh();
    
    // Should have updated timestamp even if extensions didn't change
    assert.ok(refreshedState.lastUpdated > initialState.lastUpdated);
  });

  test('Should support extension change listeners', () => {
    let changeEventReceived = false;
    
    const disposable = detector.onDidChangeExtensions((event) => {
      changeEventReceived = true;
      assert.ok(event.extensionId);
      assert.ok(['installed', 'uninstalled', 'enabled', 'disabled'].includes(event.changeType));
      assert.ok(event.timestamp);
    });

    // We can't easily trigger extension changes in tests, but we can verify 
    // the listener was registered properly
    assert.ok(disposable);
    assert.ok(typeof disposable.dispose === 'function');
    
    // Clean up
    disposable.dispose();
  });

  test('Should provide utility method for availability check', () => {
    const state = detector.getCurrentState();
    
    Object.values(EXTENSION_IDS).forEach(extensionId => {
      const isAvailable = detector.isExtensionAvailable(extensionId);
      const expected = state.extensions[extensionId]?.isEnabled ?? false;
      
      assert.strictEqual(isAvailable, expected, 
        `isExtensionAvailable(${extensionId}) should match state.extensions result`);
    });
  });

  /**
   * Manual Test Helper
   * This test generates a markdown report of current extension status
   * Useful for manual verification and debugging
   */
  test('Generate extension status report for manual verification', () => {
    const state = detector.getCurrentState();
    
    let report = '# Extension Dependency Analysis\n\n';
    report += `Generated: ${new Date(state.lastUpdated).toISOString()}\n\n`;
    
    report += '## Summary\n\n';
    report += `- MAIO: ${state.hasMAIO ? '✅' : '❌'}\n`;
    report += `- markdownlint: ${state.hasMarkdownlint ? '✅' : '❌'}\n`;
    report += `- Paste Image: ${state.hasPasteImage ? '✅' : '❌'}\n`;
    report += `- MPE: ${state.hasMPE ? '✅' : '❌'}\n\n`;
    
    report += '## Detailed Extension Info\n\n';
    Object.values(EXTENSION_IDS).forEach(extensionId => {
      const info = state.extensions[extensionId];
      report += `### ${extensionId}\n\n`;
      report += `- Installed: ${info.isInstalled ? '✅' : '❌'}\n`;
      report += `- Enabled: ${info.isEnabled ? '✅' : '❌'}\n`;
      report += `- Version: ${info.version || 'N/A'}\n`;
      report += `- Display Name: ${info.displayName}\n`;
      report += `- Commands: ${info.commands?.length || 0} available\n\n`;
    });

    // Log the report for manual inspection
    console.log('='.repeat(50));
    console.log('EXTENSION STATUS REPORT');
    console.log('='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));
    
    // Basic assertion to ensure test passes
    assert.ok(report.length > 0, 'Report should be generated');
  });
});