# Architectural Decision Records (ADRs)

## Overview
This document tracks all significant architectural decisions made during the development and evolution of the VS Code Markdown Toolbar Extension.

---

## ADR-001: Unified Command Registration Architecture

**Date:** 2025-09-02  
**Status:** ✅ Implemented  
**Decision:** Consolidate all command registration through a single CommandFactory pattern

### Context
The extension had three competing command registration systems:
- CommandRegistry (new clean classes)
- FallbackCommands (internal implementations) 
- CommandFactory (button delegation system)

This created conflicts, dead code, and unreliable functionality.

### Decision
Implement unified command architecture where:
- **CommandFactory** handles ALL command coordination
- **FallbackCommands** provides internal implementations
- **Single registration loop** in extension.ts
- **Smart delegation pattern**: External → Fallback → Fail gracefully

### Consequences
**Positive:**
- ✅ No command registration conflicts
- ✅ Consistent behavior across all commands
- ✅ Easy to add new commands
- ✅ Testable architecture with clear separation
- ✅ Extended commands work reliably

**Negative:**
- ⚠️ Required removing existing CommandRegistry classes
- ⚠️ One-time migration effort

### Implementation
- Created extended command handlers in CommandFactory
- Removed CommandRegistry.ts and individual command classes
- Updated extension.ts for unified registration
- All commands now follow same delegation pattern

---

## ADR-002: Smart Command Delegation Pattern

**Date:** 2025-09-02  
**Status:** ✅ Implemented  
**Decision:** Use three-tier fallback strategy for maximum compatibility

### Context
Extension needs to work with or without external markdown extensions (MAIO, markdownlint, etc.)

### Decision
Implement smart delegation:
1. **Try external command first** (`delegatesTo` in button definition)
2. **Fall back to internal implementation** (`fallbackCommand`)
3. **Graceful failure** with user guidance

### Example
```typescript
'fmt.bold': {
  delegatesTo: 'markdown.extension.editing.toggleBold',    // MAIO
  fallbackCommand: 'mdToolbar.internal.bold',             // Our implementation
  requiresExtension: 'yzhang.markdown-all-in-one'
}
```

### Consequences
**Positive:**
- ✅ Works with any combination of installed extensions
- ✅ Graceful degradation when extensions missing
- ✅ User-friendly extension installation prompts
- ✅ Maximum feature coverage

**Negative:**
- ⚠️ Complexity in command execution logic
- ⚠️ Need to maintain internal implementations

---

## ADR-003: Pure Logic Layer Architecture

**Date:** 2025-08-01  
**Status:** ✅ Implemented  
**Decision:** Separate formatting logic from VS Code APIs

### Context
Need testable, reusable markdown formatting logic independent of VS Code.

### Decision
Create `MarkdownFormatter` class with:
- No VS Code dependencies
- Pure function approach
- Smart toggle behavior
- Atomic text transformations

### Consequences
**Positive:**
- ✅ Easy unit testing
- ✅ Reusable across different command implementations
- ✅ Predictable behavior
- ✅ Context-aware formatting

**Negative:**
- ⚠️ Additional abstraction layer

---

## ADR-004: Button Definition System

**Date:** 2025-08-01  
**Status:** ✅ Implemented  
**Decision:** Declarative button configuration with delegation support

### Context
Need scalable way to define buttons with external extension support.

### Decision
Create `BUTTON_DEFINITIONS` with:
- Declarative configuration
- External command delegation
- Fallback command specification
- Extension requirement tracking
- Preset categorization

### Consequences
**Positive:**
- ✅ Easy to add new buttons
- ✅ Clear dependency tracking
- ✅ Automated command registration
- ✅ Flexible preset system

**Negative:**
- ⚠️ Configuration complexity

---

## ADR-005: Preset-Based UI System

**Date:** 2025-08-01  
**Status:** ✅ Implemented  
**Decision:** Use preset system to manage button combinations

### Context
Too many possible buttons would overwhelm the UI.

### Decision
Implement preset system:
- **Core:** Essential formatting (bold, italic, code, links)
- **Writer:** Writing-focused (TOC, advanced formatting)
- **Pro:** Professional (linting, enhanced previews)
- **Custom:** User-defined selection

### Consequences
**Positive:**
- ✅ Manageable UI complexity
- ✅ User choice and flexibility
- ✅ Scalable to more commands

**Negative:**
- ⚠️ Preset management complexity

---

## Decision Impact Summary

| ADR | Impact | Effort | Risk | Status |
|-----|---------|--------|------|--------|
| ADR-001 | High | Medium | Low | ✅ Complete |
| ADR-002 | High | Low | Low | ✅ Complete |
| ADR-003 | Medium | Low | Low | ✅ Complete |
| ADR-004 | Medium | Low | Low | ✅ Complete |
| ADR-005 | Medium | Low | Low | ✅ Complete |

## Future ADRs to Consider

1. **Table Management System** - Advanced table editing capabilities
2. **Export/Import Architecture** - PDF, HTML, Word export support  
3. **Plugin System** - Allow third-party command extensions
4. **Performance Optimization** - Large document handling
5. **Markdown Variants** - GitHub, CommonMark, extended syntax support