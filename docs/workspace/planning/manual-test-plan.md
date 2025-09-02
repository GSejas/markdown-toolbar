# Manual Test Plan: Extension Dependency Detection

## Overview
This manual test plan verifies the dependency detection system works correctly with real VS Code extensions. Run these tests after implementing the extension to ensure proper functionality.

---

## Pre-Test Setup

### 1. **Prepare Test Environment**
- [ ] Fresh VS Code instance or workspace
- [ ] Markdown Toolbar extension installed in development mode
- [ ] Access to VS Code Extension Marketplace
- [ ] Markdown file open for testing context

### 2. **Enable Debug Mode**
- [ ] Open VS Code Command Palette (`Cmd/Ctrl+Shift+P`)
- [ ] Run: `Markdown Toolbar: Generate Extension Analysis`
- [ ] Note initial extension state in output

---

## Test Scenarios

### **Scenario 1: Clean State Detection**
**Objective**: Verify detection works with no markdown extensions installed

**Steps**:
1. [ ] Uninstall all tracked extensions:
   - Markdown All in One (`yzhang.markdown-all-in-one`)
   - markdownlint (`DavidAnson.vscode-markdownlint`)
   - Paste Image (`mushan.vscode-paste-image`)
   - Markdown Preview Enhanced (`shd101wyy.markdown-preview-enhanced`)

2. [ ] Reload VS Code window (`Cmd/Ctrl+R`)

3. [ ] Open a markdown file

4. [ ] Check status bar - should show only basic buttons

5. [ ] Run debug command: `Markdown Toolbar: Generate Extension Analysis`

**Expected Results**:
- [ ] All dependency flags should be `false`
- [ ] Status report shows all extensions as "❌ Not installed"
- [ ] Only core preset buttons visible
- [ ] No dependency-related menu items in editor title bar

---

### **Scenario 2: MAIO Installation Detection**
**Objective**: Verify real-time detection when installing Markdown All in One

**Steps**:
1. [ ] Starting from clean state (Scenario 1)

2. [ ] Install Markdown All in One from marketplace
   - Search: "Markdown All in One"
   - Install: yzhang.markdown-all-in-one

3. [ ] **DO NOT** reload VS Code window

4. [ ] Wait 5-10 seconds for auto-detection

5. [ ] Check status bar for new buttons

6. [ ] Run debug command again

**Expected Results**:
- [ ] `hasMAIO` should automatically change to `true`
- [ ] New buttons should appear (TOC, enhanced formatting)
- [ ] Status report shows MAIO as "✅ Installed and enabled"
- [ ] Extension version should be displayed
- [ ] No manual reload required

**If Auto-Detection Fails**:
- [ ] Run: `Markdown Toolbar: Refresh Dependencies`
- [ ] Check if manual refresh fixes the issue

---

### **Scenario 3: Extension Disable/Enable**
**Objective**: Test detection when toggling extension state

**Steps**:
1. [ ] With MAIO installed and working (from Scenario 2)

2. [ ] Right-click on MAIO in Extensions panel

3. [ ] Click "Disable"

4. [ ] Wait for auto-detection (5-10 seconds)

5. [ ] Check toolbar state

6. [ ] Re-enable MAIO extension

7. [ ] Wait for auto-detection again

**Expected Results**:
- [ ] Disabling: `hasMAIO` → `false`, buttons disappear
- [ ] Enabling: `hasMAIO` → `true`, buttons reappear  
- [ ] Status report reflects current state correctly
- [ ] No errors in VS Code developer console

---

### **Scenario 4: Multiple Extensions**
**Objective**: Test complex dependency state with multiple extensions

**Steps**:
1. [ ] Install all tracked extensions:
   - Markdown All in One
   - markdownlint
   - Paste Image  
   - Markdown Preview Enhanced

2. [ ] Wait for detection

3. [ ] Verify all dependency flags are `true`

4. [ ] Check that Pro preset buttons are available

5. [ ] Test one extension disable/enable cycle

**Expected Results**:
- [ ] All dependency flags: `hasMAIO`, `hasMarkdownlint`, `hasPasteImage`, `hasMPE` = `true`
- [ ] Pro preset shows full button set
- [ ] Each extension's commands are available
- [ ] Status report shows all as enabled with versions

---

### **Scenario 5: Context Key Verification**
**Objective**: Ensure context keys are set correctly for menu visibility

**Steps**:
1. [ ] With all extensions installed (Scenario 4)

2. [ ] Open VS Code Developer Tools (`Help` → `Toggle Developer Tools`)

3. [ ] In Console, run:
   ```javascript
   // Check context keys are set
   vscode.commands.executeCommand('getContext', 'mdToolbar.hasMAIO').then(console.log);
   vscode.commands.executeCommand('getContext', 'mdToolbar.hasMarkdownlint').then(console.log);
   vscode.commands.executeCommand('getContext', 'mdToolbar.hasPasteImage').then(console.log);
   vscode.commands.executeCommand('getContext', 'mdToolbar.hasMPE').then(console.log);
   ```

4. [ ] Verify all return `true`

5. [ ] Disable one extension, wait, and recheck context keys

**Expected Results**:
- [ ] Context keys match dependency detection state
- [ ] Keys update when extensions change
- [ ] Menu items show/hide based on context keys

---

### **Scenario 6: Performance Testing**  
**Objective**: Verify caching and performance

**Steps**:
1. [ ] Open VS Code Developer Tools Console

2. [ ] Run multiple detection cycles:
   ```javascript
   // Time the detection calls
   console.time('first-call');
   // Trigger dependency detection somehow
   console.timeEnd('first-call');
   
   console.time('cached-call');
   // Trigger again immediately  
   console.timeEnd('cached-call');
   ```

3. [ ] Verify second call is much faster

4. [ ] Wait for cache timeout (30 seconds by default)

5. [ ] Test again to verify cache refresh

**Expected Results**:
- [ ] First call: longer time (extension scanning)
- [ ] Cached calls: <10ms response time
- [ ] Cache refreshes after timeout
- [ ] No memory leaks during repeated calls

---

### **Scenario 7: Edge Cases**
**Objective**: Test error handling and edge cases

**Steps**:

**7a. Network Issues**:
1. [ ] Disconnect internet
2. [ ] Try to install extension (will fail)
3. [ ] Verify extension detection still works for installed extensions

**7b. Extension Marketplace Errors**:
1. [ ] Install a broken/incompatible extension
2. [ ] Verify dependency detector doesn't crash
3. [ ] Check error handling in console

**7c. Rapid State Changes**:
1. [ ] Quickly disable/enable extension multiple times
2. [ ] Verify detection stabilizes correctly
3. [ ] No duplicate change events

**Expected Results**:
- [ ] Graceful handling of all error conditions
- [ ] No crashes or infinite loops
- [ ] Clear error logging when issues occur
- [ ] System recovers from transient failures

---

## Success Criteria

### **Core Functionality** ✅
- [ ] Detects all 4 tracked extensions correctly
- [ ] Real-time updates without VS Code restart
- [ ] Context keys set properly for menu visibility
- [ ] Caching improves performance significantly

### **Reliability** ✅  
- [ ] Handles missing extensions gracefully
- [ ] No crashes during extension state changes
- [ ] Proper cleanup when extension unloads
- [ ] Error recovery from temporary failures

### **User Experience** ✅
- [ ] Fast response times (<100ms for cached calls)
- [ ] Clear status reporting via debug command
- [ ] Intuitive button appearance/disappearance
- [ ] No unexpected behavior or flickering

---

## Debugging Helpers

### **VS Code Developer Console Commands**:
```javascript
// Check extension state
vscode.extensions.getExtension('yzhang.markdown-all-in-one')

// Force context key check  
vscode.commands.executeCommand('getContext', 'mdToolbar.hasMAIO')

// List all context keys (filter for mdToolbar)
// (This might not work, but worth trying)
```

### **Extension Debug Commands**:
- `Markdown Toolbar: Generate Extension Analysis` - Full status report
- `Markdown Toolbar: Refresh Dependencies` - Force detection refresh
- `Markdown Toolbar: Debug Context Keys` - Show all context key values

### **Log Locations**:
- VS Code Developer Tools Console
- Output panel → "Markdown Toolbar" channel
- Extension host logs (if enabled)

---

## Report Template

After running all tests, fill out:

```markdown
## Test Results Summary

**Test Date**: _____
**VS Code Version**: _____
**Extension Version**: _____
**Platform**: _____

### Scenarios Passed:
- [ ] Scenario 1: Clean State
- [ ] Scenario 2: MAIO Installation  
- [ ] Scenario 3: Enable/Disable
- [ ] Scenario 4: Multiple Extensions
- [ ] Scenario 5: Context Keys
- [ ] Scenario 6: Performance
- [ ] Scenario 7: Edge Cases

### Issues Found:
1. _____
2. _____
3. _____

### Performance Metrics:
- First detection call: _____ ms
- Cached call: _____ ms
- Extension change response: _____ ms

### Overall Status: ✅ PASS / ❌ FAIL
```

---

**Ready to test!** Run through these scenarios to verify the dependency detection system works reliably in real-world conditions.