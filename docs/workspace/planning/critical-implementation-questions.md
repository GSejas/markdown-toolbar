# Critical Implementation Questions

*These 5 questions directly block implementation - need immediate answers*

## ❗ BLOCKER #1: Command Registration Strategy

**What I need to implement next**: Command registry and package.json contributions

**Question**: Which command IDs should I use in the code I'm about to write?

```typescript
// Option A: Keep existing pattern
vscode.commands.registerCommand('markdownToolbar.bold', ...)

// Option B: New pattern from spec  
vscode.commands.registerCommand('mdToolbar.fmt.bold', ...)
```

**Decision needed**: A or B? I need to write the command registration code next.

---

## ❗ BLOCKER #2: UI Surface Location

**What I need to implement next**: Package.json menu contributions

**Question**: Where do the toolbar buttons appear?

```json
// Option A: Editor title bar (spec)
"menus": {
  "editor/title": [...]
}

// Option B: Status bar (current implementation)  
StatusBarManager creates status bar items

// Option C: Both
```

**Decision needed**: A, B, or C? This affects package.json and UI classes I'm writing.

---

## ❗ BLOCKER #3: Settings Schema  

**What I need to implement next**: PresetManager.getCurrentPreset()

**Question**: What settings keys should the PresetManager read?

```typescript
// Current implementation reads:
config.get('markdownToolbar.buttons') // string[]

// Spec suggests:
config.get('markdownToolbar.preset') // 'core'|'writer'|'pro'|'custom'  
config.get('markdownToolbar.custom.visibleButtons') // ButtonId[]
```

**Decision needed**: New schema only, or support both? I need to write the settings reading code.

---

## ❗ BLOCKER #4: Extension Detection API

**What I need to implement next**: DependencyDetector.detectExtension()

**Question**: How do I check if an extension is installed in VS Code?

```typescript
// I think it's this but need confirmation:
const ext = vscode.extensions.getExtension('yzhang.markdown-all-in-one');
const isAvailable = ext && ext.isActive;

// Or do I need to check something else?
// What about disabled extensions?
```

**Decision needed**: Exact API calls to use for extension detection.

---

## ❗ BLOCKER #5: Context Key Setting API

**What I need to implement next**: Context service that sets mdToolbar.* keys

**Question**: How do I set VS Code context keys from an extension?

```typescript
// I think it's this:
vscode.commands.executeCommand('setContext', 'mdToolbar.hasMAIO', true);

// Or is there a different API?
// Do I need to manage a context key collection?
```

**Decision needed**: Exact API for setting context keys that control menu visibility.

---

## 💯 Ready to Implement Once Answered

With these 5 answers, I can immediately implement:

1. **DependencyDetector** - will know which API calls to use
2. **PresetManager** - will know which settings to read/write  
3. **Command registration** - will know which IDs to register
4. **Package.json contributions** - will know menu structure
5. **Context key management** - will know how to set keys for `when` clauses

All the types and interfaces are ready. Just need these concrete API decisions.

---

## 🚫 Non-Critical (Can Implement Later)

These can be decided during implementation:
- Table detection algorithm details
- CTA notification UX  
- QuickPick styling
- Performance optimizations
- Error handling specifics

---

**Bottom line**: Answer the 5 blockers above and I can start implementing the core services with TDD approach.