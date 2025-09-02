# Implementation Unknowns, Questions & Inconsistencies

*Generated during Phase 1 implementation - needs clarification before proceeding*

## 🚨 Critical Decisions Needed

### 1. **Command ID Migration Strategy**
**Issue**: The spec document uses `mdToolbar.*` but existing code uses `markdownToolbar.*`

**Current State**:
- Existing: `markdownToolbar.bold`, `markdownToolbar.italic`
- Spec: `mdToolbar.fmt.bold`, `mdToolbar.fmt.italic`

**Questions**:
- Do we completely migrate all command IDs? 
- Should we register both for compatibility?
- What about keyboard shortcuts that reference old commands?

**Impact**: High - affects package.json contributions, command palette, keybindings

---

### 2. **Settings Schema Conflicts**
**Issue**: Multiple overlapping configuration approaches

**Current Schema**:
```json
"markdownToolbar.buttons": ["bold", "italic", "code", "link", "list"]
```

**New Schema**:
```json
"markdownToolbar.preset": "core",
"markdownToolbar.custom.visibleButtons": ["fmt.bold", "fmt.italic"]
```

**Questions**:
- Do we migrate old `buttons` array automatically?
- How do we handle users who have customized the old system?
- Should we support both schemas during transition?

**Impact**: High - user settings migration, breaking changes

---

### 3. **Button ID vs Display Name Confusion**
**Issue**: Inconsistent naming between button IDs and display

**Examples from spec**:
- Button ID: `fmt.bold` vs Display: "Bold"
- Button ID: `preview.side` vs Command: `markdown.showPreviewToSide`

**Questions**:
- Are button IDs internal-only or exposed to users in settings?
- Should custom preset settings use button IDs or human names?
- How do we handle internationalization?

**Impact**: Medium - affects settings UI, user experience

---

## 🔍 Technical Inconsistencies Found

### 4. **Context Key Naming Patterns**
**Inconsistencies**:
- Some use camelCase: `mdToolbar.hasMAIO`
- Some use dots: `mdToolbar.preset`
- Built-in VS Code: `editorLangId == markdown`

**Questions**:
- Should we standardize on one pattern?
- Do VS Code context keys have naming conventions we should follow?
- What's the performance impact of many context keys?

---

### 5. **Menu vs Status Bar Button Redundancy**
**Issue**: The spec shows buttons in both editor/title menu AND status bar

**Current Implementation**: Status bar only
**Spec Implementation**: Editor title menu

**Questions**:
- Do we keep both or migrate completely?
- How do users discover features in editor/title vs status bar?
- What's the performance impact of many menu items?

---

### 6. **Extension Dependency Detection Timing**
**Issue**: When and how often do we check for extensions?

**Scenarios**:
- On activation (slow startup?)
- On first markdown file open
- On settings change
- When user tries to use a feature
- Continuously in background

**Questions**:
- Do extension state changes fire events we can listen to?
- Should we cache detection results? For how long?
- What's the UX when detection is stale?

---

## 🎯 UX/Product Questions

### 7. **CTA (Call-to-Action) Behavior**
**Issue**: What happens when user clicks missing dependency?

**Spec says**: "Show CTA with Install button"

**Questions**:
- Do we open VS Code marketplace?
- Do we show inline installation progress?
- What if installation fails?
- Should we hide buttons or gray them out?
- Do we retry detection automatically?

---

### 8. **Preset Auto-Switching Logic**
**Issue**: Should presets adapt when extensions are installed/removed?

**Scenarios**:
- User has Core preset, installs MAIO → switch to Writer?
- User has Pro preset, uninstalls markdownlint → downgrade?
- User manually selected preset → never auto-switch?

**Questions**:
- Is this helpful or annoying to users?
- Should we show notifications about preset changes?
- How do we handle partial extension availability?

---

### 9. **Custom Preset Button Ordering**
**Issue**: How does button ordering work in custom preset?

**Implementation Options**:
1. Array order in settings determines display order
2. Predefined categories with sub-ordering
3. Drag-and-drop in QuickPick interface

**Questions**:
- How technically complex is each approach?
- What do users expect from "customize buttons"?
- Should we group by category or allow free ordering?

---

## 📊 Performance & Scale Questions

### 10. **Context Detection Frequency**
**Issue**: How often do we update context (table, task, formatting state)?

**Current**: On selection change (could be very frequent)

**Questions**:
- Should we debounce context detection?
- What's the performance cost of regex scanning?
- Do we detect context for all buttons or just visible ones?
- Should we cache context results per document position?

---

### 11. **Menu Item Visibility Performance**
**Issue**: Many menu items with complex `when` clauses

**Example When Clause**:
```json
"when": "editorLangId == markdown && mdToolbar.hasMAIO && (mdToolbar.preset == 'writer' || mdToolbar.preset == 'pro') && mdToolbar.inTable"
```

**Questions**:
- Does VS Code efficiently evaluate complex when clauses?
- Should we pre-compute visibility and update context keys instead?
- What's the limit on menu items before UX degrades?

---

## 🔧 Implementation Gaps

### 12. **Internal Fallback Command Implementation**
**Issue**: We defined fallback commands but they don't exist yet

**Examples**:
- `mdToolbar.internal.bold` → needs implementation
- `mdToolbar.internal.tableMenu` → completely new functionality

**Questions**:
- Do we implement ALL fallbacks or just essential ones?
- Should fallbacks have feature parity or be simplified?
- How do we test fallback commands vs delegated commands?

---

### 13. **Table Context Detection Algorithm**
**Issue**: No spec for how "inTable" detection works

**Challenges**:
- Malformed tables (missing pipes, alignment)
- Cursor position edge cases (start/end of line)
- Multi-line table cells
- Table inside code blocks

**Questions**:
- Should we be permissive or strict about table format?
- Do we detect GitHub-style tables only or others?
- How do we handle edge cases gracefully?

---

### 14. **QuickPick Implementation Details**
**Issue**: Spec shows mockups but no implementation guidance

**QuickPick Features Needed**:
- Multi-select for custom buttons
- Category grouping
- Dependency indicators
- Real-time preview?
- Drag-and-drop reordering?

**Questions**:
- Which VS Code QuickPick features do we use?
- How do we show button categories visually?
- Should we show extension requirements in QuickPick?

---

## 🧪 Testing Strategy Gaps

### 15. **Integration Test Scope**
**Issue**: E2E tests need real extension installations

**Test Scenarios Needing Clarification**:
- How do we test without installing actual extensions?
- Should we mock VS Code extension API?
- Do we test against specific extension versions?
- How do we test extension state change events?

**Questions**:
- Can we bundle test extensions for CI?
- Should we test in isolated extension host?
- How do we test marketplace integration (CTA flows)?

---

## 📋 Documentation Inconsistencies

### 16. **Spec vs Planning Doc Differences**
**Found Differences**:

| Aspect | Original Spec | Planning Docs | Resolution Needed |
|--------|---------------|---------------|-------------------|
| Command naming | `mdToolbar.*` | `markdownToolbar.*` | Which to use? |
| Coverage thresholds | 80/70 | 75/65 | Which targets? |
| Test framework | Not specified | Vitest confirmed | ✅ Resolved |
| Menu location | Editor title | Status bar | Both or migrate? |

---

## 🔄 Next Steps for Clarification

### Priority 1 (Must resolve before continuing):
1. **Command ID migration strategy** - affects all future work
2. **Settings schema compatibility** - affects user migration
3. **Menu vs status bar decision** - affects package.json

### Priority 2 (Can implement with assumptions):
4. Context key naming standardization
5. CTA behavior specification
6. Preset auto-switching logic

### Priority 3 (Can defer):
7. Performance optimization details
8. Advanced QuickPick features
9. Complex table detection edge cases

---

## 💡 Recommended Decisions (for discussion)

Based on implementation so far, I recommend:

1. **Complete migration** to new command structure (no compatibility layer)
2. **Editor title menu** primary UI (more discoverable than status bar)
3. **Conservative context detection** (prefer false negatives over false positives)
4. **Simple fallbacks** (don't try to match full feature parity)
5. **Explicit user actions** for preset switching (no auto-switching)

These maintain the principle of "clean migration" while reducing implementation complexity.

---

*This document should be updated as we resolve unknowns and discover new ones during implementation.*