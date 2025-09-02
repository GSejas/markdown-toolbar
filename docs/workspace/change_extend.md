\[Unverified]

Below is a **one-shot prompt** you can paste into Claude Code (or any code agent) to implement the full architecture & design upgrades, add tests, and improve docs. It assumes the repo already follows the structure described in your `CLAUDE.md`. It is opinionated and comprehensive.

---

# ONE-SHOT PROMPT — PRINCIPAL ARCHITECT IMPLEMENTATION BRIEF

**Role:** You are a principal VS Code extension architect and test-driven engineer.
**Goal:** Implement a dependency-aware, context-aware Markdown toolbar with three presets (Core/Writer/Pro) + Custom mode, robust tests, and complete docs, while preserving the existing architecture in `CLAUDE.md`.

## 0) Ground Rules

* Do not remove existing behavior; extend it with clean seams.
* Maintain **pure logic** in `src/engine/` and keep VS Code API calls outside it.
* Use **constructor injection** for anything that touches VS Code APIs (consistent with `SettingsAdapter`).
* Use **atomic document edits** for text transformations.
* Follow **conventional commits** in messages and a **CHANGELOG** entry.

---

## 1) High-Level Deliverables

1. **New capabilities**

   * Presets: `core`, `writer`, `pro`, and `custom`.
   * Dependency detection & context keys for:

     * Markdown All in One (MAIO)
     * markdownlint
     * Paste Image
     * Markdown Preview Enhanced (MPE)
   * Context-aware surfacing for:

     * In-table cursor (`mdToolbar.inTable`)
     * On task-list line (`mdToolbar.onTaskLine`)
   * QuickPick flows:

     * “Switch Preset”
     * “Customize Buttons…”
   * Optional **status bar micro-mode** (compact icons + preset switcher)

2. **Docs**

   * Update `README.md` with features, screenshots (can be ASCII placeholders), and quickstart.
   * Expand `CLAUDE.md` to include new modules and test strategy.
   * Add `COMMANDS.md` with a complete **command matrix** (see Section 4).
   * Add `UX_GUIDE.md` (accessibility, keyboard, and UX guardrails).
   * Start a `CHANGELOG.md` entry for this release.

3. **Tests**

   * **Unit** (Vitest) for all new pure logic and settings behavior.
   * **Integration** (VS Code extension tests) for:

     * Context key wiring and menu visibility
     * Command delegation and fallbacks
     * Preset switching + settings persistence
     * Error/CTA flows when dependencies are missing
   * Raise coverage thresholds to **80% statements / 70% branches**.

---

## 2) Files to Add/Modify (scaffold precisely)

### 2.1 New modules

```
src/presets/PresetManager.ts
src/deps/DependencyDetector.ts
src/context/TableContextService.ts
src/context/TaskLineService.ts
src/commands/customize/ShowPresetQuickPick.ts
src/commands/customize/ShowCustomizeButtonsQuickPick.ts
src/constants/contextKeys.ts
src/constants/configKeys.ts
src/types/Buttons.ts
```

**`src/constants/contextKeys.ts`**

```ts
export const CTX = {
  hasMAIO: 'mdToolbar.hasMAIO',
  hasMarkdownlint: 'mdToolbar.hasMarkdownlint',
  hasPasteImage: 'mdToolbar.hasPasteImage',
  hasMPE: 'mdToolbar.hasMPE',
  preset: 'mdToolbar.preset',           // 'core'|'writer'|'pro'|'custom'
  inTable: 'mdToolbar.inTable',
  onTaskLine: 'mdToolbar.onTaskLine',
} as const;
```

**`src/constants/configKeys.ts`**

```ts
export const CFG = {
  root: 'markdownToolbar',
  preset: 'markdownToolbar.preset',                         // string enum
  customVisible: 'markdownToolbar.custom.visibleButtons',   // string[]
  compact: 'markdownToolbar.compact',                       // boolean
  statusBarEnabled: 'markdownToolbar.statusBar.enabled',    // boolean
} as const;
```

**`src/types/Buttons.ts`**

```ts
export type PresetId = 'core' | 'writer' | 'pro' | 'custom';

export type ButtonId =
  | 'preview.side' | 'preview.current'
  | 'fmt.bold' | 'fmt.italic' | 'fmt.strike'
  | 'list.toggle' | 'task.toggle'
  | 'code.inline' | 'code.block'
  | 'link.insert' | 'image.insert' | 'image.paste'
  | 'toc.create' | 'toc.update' | 'toc.addNumbers' | 'toc.removeNumbers'
  | 'table.menu'
  | 'lint.fix' | 'lint.workspace'
  | 'preview.mpe.side' | 'preview.mpe.current';
```

**`src/deps/DependencyDetector.ts`**

* Detect installed extensions once on activation and on `extensions.onDidChange`.
* Set corresponding context keys from `CTX`.

**`src/presets/PresetManager.ts`**

* Read/write `CFG.preset`, `CFG.customVisible`, `CFG.compact`.
* Provide computed effective button set given preset and custom list.
* Expose API to QuickPick commands to change preset and custom selection.
* Write context key `CTX.preset`.

**`src/context/TableContextService.ts`**

* Lightweight detection: if current/adjacent lines form a pipe table, set `CTX.inTable`.

**`src/context/TaskLineService.ts`**

* Detect `- [ ]` / `- [x]` at start of line for `CTX.onTaskLine`.

**`src/commands/customize/ShowPresetQuickPick.ts` and `ShowCustomizeButtonsQuickPick.ts`**

* Implement QuickPicks to switch preset and to multi-select visible buttons (update settings).

### 2.2 Modify existing

**`src/extension.ts`**

* Instantiate: `DependencyDetector`, `PresetManager`, `TableContextService`, `TaskLineService`.
* Register:

  * Command proxies (delegating to MAIO/markdownlint/Paste Image/MPE when present).
  * Internal fallbacks for bold/italic/strike/list/code/link/image (use `MarkdownFormatter`).
  * QuickPick commands:

    * `mdToolbar.switchPreset`
    * `mdToolbar.customizeButtons`
* Wire event listeners for active editor & selection changes; debounce updates to context services.

**`src/ui/StatusBarManager.ts`**

* If `CFG.statusBarEnabled`, show preset label (`Core/Writer/Pro/Custom ▾`) that triggers `mdToolbar.switchPreset`.
* Optional compact actions if `CFG.compact` is true (just labels + tooltips).

**`src/settings/SettingsAdapter.ts`**

* Extend schema accessors for the new keys.
* Maintain constructor injection pattern for testability.

**`src/engine/MarkdownFormatter.ts`**

* Add minimal internal helpers for:

  * strikethrough toggle
  * code block fencing (with default language choice, if any)
  * simple table insertion/format (if you decide not to delegate table formatting)

---

## 3) `package.json` Contributions (augment precisely)

* **Configuration**

```json
"contributes": {
  "configuration": {
    "title": "Markdown Toolbar",
    "properties": {
      "markdownToolbar.preset": {
        "type": "string",
        "enum": ["core","writer","pro","custom"],
        "default": "core",
        "description": "Selects which toolbar preset is active."
      },
      "markdownToolbar.custom.visibleButtons": {
        "type": "array",
        "items": { "type": "string" },
        "default": [],
        "description": "IDs of buttons to show when preset is 'custom'. Controls order."
      },
      "markdownToolbar.compact": {
        "type": "boolean",
        "default": false,
        "description": "Render a compact status bar mini-toolbar."
      },
      "markdownToolbar.statusBar.enabled": {
        "type": "boolean",
        "default": true,
        "description": "Show preset switcher in status bar."
      }
    }
  },
```

* **Commands** (representative; ensure all IDs below exist)

```json
"commands": [
  { "command": "mdToolbar.preview.side", "title": "$(preview) Preview (Side)" },
  { "command": "mdToolbar.preview.current", "title": "$(preview) Preview" },

  { "command": "mdToolbar.fmt.bold", "title": "$(bold) Bold" },
  { "command": "mdToolbar.fmt.italic", "title": "$(italic) Italic" },
  { "command": "mdToolbar.fmt.strike", "title": "$(strikethrough) Strikethrough" },

  { "command": "mdToolbar.list.toggle", "title": "$(list-unordered) Toggle List" },
  { "command": "mdToolbar.task.toggle", "title": "$(checklist) Toggle Task" },

  { "command": "mdToolbar.code.inline", "title": "` Code" },
  { "command": "mdToolbar.code.block", "title": "$(terminal) Code Block" },

  { "command": "mdToolbar.link.insert", "title": "$(link) Insert Link" },
  { "command": "mdToolbar.image.insert", "title": "$(image) Insert Image" },
  { "command": "mdToolbar.image.paste", "title": "$(file-media) Paste Image" },

  { "command": "mdToolbar.toc.create", "title": "$(list-ordered) TOC: Create" },
  { "command": "mdToolbar.toc.update", "title": "$(list-ordered) TOC: Update" },
  { "command": "mdToolbar.toc.addNumbers", "title": "$(list-ordered) TOC: Add Numbers" },
  { "command": "mdToolbar.toc.removeNumbers", "title": "$(list-ordered) TOC: Remove Numbers" },

  { "command": "mdToolbar.table.menu", "title": "$(table) Table Menu" },

  { "command": "mdToolbar.lint.fix", "title": "$(wrench) Fix All (markdownlint)" },
  { "command": "mdToolbar.lint.workspace", "title": "$(wrench) Lint Workspace" },

  { "command": "mdToolbar.preview.mpe.side", "title": "$(preview) Enhanced Preview (Side)" },
  { "command": "mdToolbar.preview.mpe.current", "title": "$(preview) Enhanced Preview" },

  { "command": "mdToolbar.switchPreset", "title": "Markdown Toolbar: Switch Preset" },
  { "command": "mdToolbar.customizeButtons", "title": "Markdown Toolbar: Customize Buttons…" }
],
```

* **Menus** (*editor/title* visibility controlled by preset, dependencies, and context keys)

```json
"menus": {
  "editor/title": [
    { "command": "mdToolbar.preview.side", "group": "navigation@10", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.preview.current", "group": "navigation@10", "when": "editorLangId == markdown" },

    { "command": "mdToolbar.fmt.bold", "group": "navigation@20", "when": "editorLangId == markdown && mdToolbar.preset != 'pro' || editorLangId == markdown && mdToolbar.preset == 'pro'" },
    { "command": "mdToolbar.fmt.italic", "group": "navigation@20", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.fmt.strike", "group": "navigation@20", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.list.toggle", "group": "navigation@20", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.task.toggle", "group": "navigation@20", "when": "editorLangId == markdown && mdToolbar.onTaskLine" },
    { "command": "mdToolbar.code.inline", "group": "navigation@30", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.code.block", "group": "navigation@30", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.link.insert", "group": "navigation@30", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.image.insert", "group": "navigation@30", "when": "editorLangId == markdown" },
    { "command": "mdToolbar.image.paste", "group": "navigation@30", "when": "editorLangId == markdown && mdToolbar.hasPasteImage" },

    { "command": "mdToolbar.toc.create", "group": "navigation@40", "when": "editorLangId == markdown && mdToolbar.hasMAIO && (mdToolbar.preset == 'writer' || mdToolbar.preset == 'pro')" },
    { "command": "mdToolbar.toc.update", "group": "navigation@40", "when": "editorLangId == markdown && mdToolbar.hasMAIO && (mdToolbar.preset == 'writer' || mdToolbar.preset == 'pro')" },
    { "command": "mdToolbar.toc.addNumbers", "group": "navigation@40", "when": "editorLangId == markdown && mdToolbar.hasMAIO && mdToolbar.preset == 'pro'" },
    { "command": "mdToolbar.toc.removeNumbers", "group": "navigation@40", "when": "editorLangId == markdown && mdToolbar.hasMAIO && mdToolbar.preset == 'pro'" },

    { "command": "mdToolbar.table.menu", "group": "navigation@50", "when": "editorLangId == markdown && mdToolbar.inTable && (mdToolbar.preset == 'writer' || mdToolbar.preset == 'pro')" },

    { "command": "mdToolbar.lint.fix", "group": "navigation@60", "when": "editorLangId == markdown && mdToolbar.hasMarkdownlint && mdToolbar.preset == 'pro'" },
    { "command": "mdToolbar.lint.workspace", "group": "navigation@60", "when": "editorLangId == markdown && mdToolbar.hasMarkdownlint && mdToolbar.preset == 'pro'" },

    { "command": "mdToolbar.preview.mpe.side", "group": "navigation@70", "when": "editorLangId == markdown && mdToolbar.hasMPE && mdToolbar.preset == 'pro'" },
    { "command": "mdToolbar.preview.mpe.current", "group": "navigation@70", "when": "editorLangId == markdown && mdToolbar.hasMPE && mdToolbar.preset == 'pro'" }
  ]
}
```

> Note: For **Custom** preset, filter the menu at runtime by comparing the `custom.visibleButtons` list to contributed commands. If necessary, hide undesired buttons by setting extra context keys like `mdToolbar.show.<buttonId>`.

---

## 4) Command Matrix (include in `COMMANDS.md`)

| Button ID            | Title                   | Delegates to                                             | Dependency    | Context/When                                                         | Icon (title)        | Category  |
| -------------------- | ----------------------- | -------------------------------------------------------- | ------------- | -------------------------------------------------------------------- | ------------------- | --------- |
| preview\.side        | Preview (Side)          | `markdown.showPreviewToSide`                             | –             | `editorLangId==markdown`                                             | `$(preview)`        | Preview   |
| preview\.current     | Preview                 | `markdown.showPreview`                                   | –             | `editorLangId==markdown`                                             | `$(preview)`        | Preview   |
| fmt.bold             | Bold                    | MAIO `markdown.extension.editing.toggleBold` or internal | MAIO optional | `editorLangId==markdown`                                             | `$(bold)`           | Format    |
| fmt.italic           | Italic                  | MAIO `...toggleItalic` or internal                       | MAIO optional | same                                                                 | `$(italic)`         | Format    |
| fmt.strike           | Strikethrough           | MAIO `...toggleStrikethrough` or internal                | MAIO optional | same                                                                 | `$(strikethrough)`  | Format    |
| list.toggle          | Toggle List             | MAIO `...toggleList` or internal                         | MAIO optional | same                                                                 | `$(list-unordered)` | Structure |
| task.toggle          | Toggle Task             | internal                                                 | –             | `editorLangId==markdown && mdToolbar.onTaskLine`                     | `$(checklist)`      | Structure |
| code.inline          | Code                    | MAIO `...toggleCodeSpan` or internal                     | MAIO optional | `editorLangId==markdown`                                             | `` ` ``             | Code      |
| code.block           | Code Block              | MAIO `...toggleCodeBlock` or internal                    | MAIO optional | same                                                                 | `$(terminal)`       | Code      |
| link.insert          | Insert Link             | internal                                                 | –             | `editorLangId==markdown`                                             | `$(link)`           | Media     |
| image.insert         | Insert Image            | internal (path picker)                                   | –             | same                                                                 | `$(image)`          | Media     |
| image.paste          | Paste Image             | `extension.pasteImage`                                   | Paste Image   | `editorLangId==markdown && mdToolbar.hasPasteImage`                  | `$(file-media)`     | Media     |
| toc.create           | TOC: Create             | MAIO `markdown.extension.toc.create`                     | MAIO          | `editorLangId==markdown && mdToolbar.hasMAIO && preset≥Writer`       | `$(list-ordered)`   | Structure |
| toc.update           | TOC: Update             | MAIO `markdown.extension.toc.update`                     | MAIO          | same                                                                 | `$(list-ordered)`   | Structure |
| toc.addNumbers       | TOC: Add Numbers        | MAIO                                                     | MAIO          | `editorLangId==markdown && mdToolbar.hasMAIO && preset==Pro`         | `$(list-ordered)`   | Structure |
| toc.removeNumbers    | TOC: Remove Numbers     | MAIO                                                     | MAIO          | same                                                                 | `$(list-ordered)`   | Structure |
| table.menu           | Table Menu              | internal submenu                                         | –             | `editorLangId==markdown && mdToolbar.inTable && preset≥Writer`       | `$(table)`          | Structure |
| lint.fix             | Fix All                 | `markdownlint.fixAll`                                    | markdownlint  | `editorLangId==markdown && mdToolbar.hasMarkdownlint && preset==Pro` | `$(wrench)`         | Quality   |
| lint.workspace       | Lint Workspace          | `markdownlint.lintWorkspace`                             | markdownlint  | same                                                                 | `$(wrench)`         | Quality   |
| preview\.mpe.side    | Enhanced Preview (Side) | `markdown-preview-enhanced.openPreviewToTheSide`         | MPE           | `editorLangId==markdown && mdToolbar.hasMPE && preset==Pro`          | `$(preview)`        | Preview   |
| preview\.mpe.current | Enhanced Preview        | `...openPreview`                                         | MPE           | same                                                                 | `$(preview)`        | Preview   |

---

## 5) Tests — Plan & Files

**Unit (Vitest)**

```
test/unit/presets/PresetManager.spec.ts
test/unit/deps/DependencyDetector.spec.ts
test/unit/context/TableContextService.spec.ts
test/unit/context/TaskLineService.spec.ts
test/unit/settings/SettingsAdapter.spec.ts   // new keys
test/unit/engine/MarkdownFormatter.spec.ts   // new toggles/codeBlock/table insert minimal
```

**Integration (VS Code)**

```
test/integration/activation.spec.ts
 - activates on markdown, sets base context keys

test/integration/menus-visibility.spec.ts
 - asserts visibility toggles for preset, deps, inTable/onTaskLine

test/integration/commands-delegation.spec.ts
 - stubs executeCommand to simulate presence/absence of MAIO/mdlint/PasteImage/MPE
 - verifies fallbacks and CTA messages

test/integration/customize-quickpicks.spec.ts
 - verifies preset switching and custom visible button filtering
```

**Coverage target:** Update scripts to enforce **80/70** thresholds (`npm run test:cov`).

---

## 6) Docs — Exact Tasks

* **README.md**

  * What it does (presets, dependency-aware, context-aware)
  * Quickstart + animated GIFs (ASCII placeholders ok)
  * Settings table (preset, custom.visibleButtons, compact, statusBar.enabled)
  * Troubleshooting (missing dependency CTAs)
* **CLAUDE.md**

  * Keep original sections; **add** new modules, context keys, QuickPick flows, integration tests overview.
* **COMMANDS.md**

  * Include the full **Command Matrix** (Section 4).
* **UX\_GUIDE.md**

  * Accessibility, keyboard parity, no keybinding overrides by default, feedback toasts.
* **CHANGELOG.md**

  * New features, breaking changes (none expected), and test coverage bump.

---

## 7) Implementation Notes (precise behaviors)

* **Delegation & fallbacks**

  * Try external command via `executeCommand(id, ...)`.
  * On failure or not installed: show CTA toast with “Install” action (open marketplace) and bail gracefully.
  * Internal fallbacks for basic formatting (bold/italic/strike/code/list/link/image).
* **Context detection**

  * `TableContextService`: naive pipe-table detection on current/adjacent lines; debounce updates on cursor move.
  * `TaskLineService`: regex `^\s*-\s*\[( |x|X)\]\s` for task lines.
* **Custom preset filtering**

  * Maintain a map `buttonId -> contextKey` if you choose to drive visibility via context keys.
  * Or dynamically set `enablement` via `setContext('mdToolbar.show.<id>', true/false)` during activation + on settings change.
* **Status bar**

  * Left-click → QuickPick “Switch Preset”.
  * Tooltip shows active preset + hint for “Customize Buttons…”.
* **Atomic edits**

  * Ensure all formatter transforms batch into single `TextEditorEdit`.

---

## 8) Scripts & CI

* Keep existing scripts; ensure:

  * `npm run test` runs unit + integration.
  * `npm run test:cov` enforces updated thresholds.
* Add a lightweight `lint:fix` if not present.

---

## 9) Acceptance Criteria (verify before completion)

* Presets working; QuickPick switching persists at user scope.
* Custom visible buttons list both **shows** and **orders** buttons accordingly.
* Dependency keys flip on install/uninstall without reload (listen to `extensions.onDidChange`).
* Context keys update on cursor movement for tables and task lines.
* CTA workflow appears for missing MAIO/markdownlint/Paste Image/MPE.
* All new unit + integration tests pass; coverage ≥ 80/70.
* Docs updated: `README.md`, `CLAUDE.md`, `COMMANDS.md`, `UX_GUIDE.md`, `CHANGELOG.md`.

---

## 10) Commit Plan (conventional commits)

1. `feat(presets): add PresetManager and settings schema`
2. `feat(deps): detect installed extensions and set context keys`
3. `feat(context): add table and task context services`
4. `feat(commands): add delegation + fallbacks for formatting and partners`
5. `feat(ui): contribute editor/title menus and status bar micro-mode`
6. `feat(customize): QuickPick for preset and per-button visibility`
7. `test(unit): add unit tests for presets/deps/context/formatter/settings`
8. `test(integration): add VS Code tests for menus/commands/customize`
9. `docs: update README/CLAUDE and add COMMANDS, UX_GUIDE, CHANGELOG`
10. `chore: raise coverage thresholds and polish scripts`

---

### Now proceed:

* Inspect the repository to confirm current structure matches `CLAUDE.md`.
* Implement the modules and contributions exactly as specified.
* Write tests and docs.
* Open a PR titled **“Presets, Dependency-Aware Toolbar, Context Services, and Docs+Tests”** with the updated artifacts and passing checks.

---

\[Verified]

Yes. I pulled the **exact command IDs** for the integrations we’re targeting and mapped them to the toolbar actions you proposed. You can wire these directly via `vscode.commands.executeCommand(...)` and guard their visibility with your dependency/context keys.

### Built-in Markdown (vscode.markdown-language-features)

| Feature                                                                                                         | Command ID                   |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Open Preview                                                                                                    | `markdown.showPreview`       |
| Open Preview (Side)                                                                                             | `markdown.showPreviewToSide` |
| Sources: VS Code docs and usage examples show these command IDs. ([Visual Studio Code][1], [Stack Overflow][2]) |                              |

### Markdown All in One (publisher: `yzhang.markdown-all-in-one`)

| Category                                                                                                                                                                                                             | Feature                | Command ID                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| Editing                                                                                                                                                                                                              | Toggle bold            | `markdown.extension.editing.toggleBold`                                                       |
|                                                                                                                                                                                                                      | Toggle italic          | `markdown.extension.editing.toggleItalic`                                                     |
|                                                                                                                                                                                                                      | Toggle strikethrough   | `markdown.extension.editing.toggleStrikethrough`                                              |
|                                                                                                                                                                                                                      | Toggle list            | `markdown.extension.editing.toggleList`                                                       |
|                                                                                                                                                                                                                      | Toggle inline code     | `markdown.extension.editing.toggleCodeSpan`                                                   |
|                                                                                                                                                                                                                      | Toggle code block      | `markdown.extension.editing.toggleCodeBlock`                                                  |
|                                                                                                                                                                                                                      | Heading up/down        | `markdown.extension.editing.toggleHeadingUp` / `markdown.extension.editing.toggleHeadingDown` |
| TOC                                                                                                                                                                                                                  | Create TOC             | `markdown.extension.toc.create`                                                               |
|                                                                                                                                                                                                                      | Update TOC             | `markdown.extension.toc.update`                                                               |
|                                                                                                                                                                                                                      | Add section numbers    | `markdown.extension.toc.addSecNumbers`                                                        |
|                                                                                                                                                                                                                      | Remove section numbers | `markdown.extension.toc.removeSecNumbers`                                                     |
| Sources: MAIO keybinding/command references list these IDs; multiple docs/posts corroborate TOC command IDs and editing toggles. ([vspacecode.github.io][3], [GitHub][4], [Qiita][5], [think and error - 思考錯誤 -][6]) |                        |                                                                                               |

### markdownlint (publisher: `DavidAnson.vscode-markdownlint`)

| Feature                                                                                      | Command ID                   |
| -------------------------------------------------------------------------------------------- | ---------------------------- |
| Fix all problems (current doc)                                                               | `markdownlint.fixAll`        |
| Lint entire workspace                                                                        | `markdownlint.lintWorkspace` |
| Sources: Official README (Commands section) plus issues referencing these IDs. ([GitHub][7]) |                              |

### Paste Image (publisher: `mushan.vscode-paste-image`)

| Feature                                                                                                                                                                             | Command ID             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Paste image from clipboard                                                                                                                                                          | `extension.pasteImage` |
| Sources: Marketplace usage and common keybinding examples consistently show this command ID. ([Visual Studio Marketplace][8], [TeX - LaTeX Stack Exchange][9], [lavinoys blog][10]) |                        |

### Markdown Preview Enhanced (publisher: `shd101wyy.markdown-preview-enhanced`)

| Feature                                                                                                   | Command ID                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Open MPE preview                                                                                          | `markdown-preview-enhanced.openPreview`          |
| Open MPE preview (Side)                                                                                   | `markdown-preview-enhanced.openPreviewToTheSide` |
| (Other MPE commands like code-chunk execution exist, but the two above are the key preview entry points.) |                                                  |
| Sources: Project docs and issues reference these IDs. ([shd101wyy.github.io][11], [GitHub][12])           |                                                  |

---

### How to wire these (example)

```ts
// Built-in preview
await vscode.commands.executeCommand('markdown.showPreviewToSide');

// Delegate to MAIO if installed (else show CTA)
await vscode.commands.executeCommand('markdown.extension.editing.toggleBold');

// markdownlint (Pro preset)
await vscode.commands.executeCommand('markdownlint.fixAll');

// Paste Image (only if installed)
await vscode.commands.executeCommand('extension.pasteImage');

// MPE (Pro preset)
await vscode.commands.executeCommand('markdown-preview-enhanced.openPreviewToTheSide');
```

### Suggested `when` guards (editor/title menu)

```json
"when": "editorLangId == markdown && mdToolbar.hasMAIO"
```

```json
"when": "editorLangId == markdown && mdToolbar.hasMarkdownlint && mdToolbar.preset == 'pro'"
```

```json
"when": "editorLangId == markdown && mdToolbar.hasPasteImage"
```

```json
"when": "editorLangId == markdown && mdToolbar.hasMPE && mdToolbar.preset == 'pro'"
```

If you want, I can drop these into your `COMMANDS.md` matrix and the `package.json` contributions so the IDs are centralized and tested.

[1]: https://code.visualstudio.com/docs/languages/markdown?utm_source=chatgpt.com "Markdown and Visual Studio Code"
[2]: https://stackoverflow.com/questions/63960216/from-vs-code-extension-api-open-file-in-markdown-preview?utm_source=chatgpt.com "From VS Code Extension API open file in markdown preview"
[3]: https://vspacecode.github.io/docs/default-keybindings/?utm_source=chatgpt.com "Default Keybindings - VSpaceCode"
[4]: https://github.com/yzhang-gh/vscode-markdown/issues/1182?utm_source=chatgpt.com "Allow Markdown All in One to be activated inmediately ..."
[5]: https://qiita.com/Yarakashi_Kikohshi/items/407f85ba2835d945dd5b?utm_source=chatgpt.com "VSCode でちょっとでもMarkdown する"
[6]: https://halap.hatenablog.com/entry/2021/09/19/020739?utm_source=chatgpt.com "VScodeを使いこなそう - think and error - 思考錯誤 -"
[7]: https://github.com/DavidAnson/vscode-markdownlint?utm_source=chatgpt.com "DavidAnson/vscode-markdownlint: Markdown linting and ..."
[8]: https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image&utm_source=chatgpt.com "Paste Image"
[9]: https://tex.stackexchange.com/questions/724779/copy-pasting-images-in-vs-code-like-in-texstudo?utm_source=chatgpt.com "Copy-Pasting images in VS Code like in TeXstudo"
[10]: https://lavinoys.github.io/blog/nextjs-blog/6-images-use-in-vscode?utm_source=chatgpt.com "Next.js 블로그 mdx에서 이미지 복붙하기 (feat. Paste Image)"
[11]: https://shd101wyy.github.io/markdown-preview-enhanced/?utm_source=chatgpt.com "Markdown Preview Enhanced"
[12]: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1238?utm_source=chatgpt.com "command '...' not found when using preview · Issue #1238"

---

\[Unverified]

Below are design proposals (not facts) for a VS Code Markdown toolbar extension. They include multi‑level wireframes from information architecture down to component specs. Adjust as needed during implementation.

---

# 0) Legend

* `$(...)` = Codicon (e.g., `$(bold)`, `$(italic)`, `$(list-unordered)`, `$(list-ordered)`, `$(checklist)`, `$(preview)`, `$(terminal)`, `$(link)`, `$(image)`, `$(table)`, `$(wrench)`).
* `[btn]` = toolbar button; `(ctx)` = context menu item; `{key}` = keyboard shortcut.
* Surfaces: **Editor Title Bar**, **Command Palette**, **Status Bar**, **Context Menu**.

---

# 1) Information Architecture & Journeys Map (Big Picture)

```
Markdown Toolbar Extension
├─ Presets (view modes)
│  ├─ Core (Level 1)
│  ├─ Writer (Level 2)
│  └─ Pro (Level 3)
│
├─ Customization
│  ├─ QuickPick: Switch Preset
│  ├─ QuickPick: Customize Buttons (checklist + reorder)
│  └─ Settings: mdToolbar.* (preset, visibleButtons, compact)
│
├─ Dependency-aware Features (appear only if installed)
│  ├─ Markdown All in One (MAIO): TOC, toggles
│  ├─ markdownlint: Fix All, Lint Workspace
│  └─ Paste Image: Clipboard → file + link
│
├─ Context-aware Features
│  ├─ Table tools only inside tables
│  ├─ Task toggles only on task-list lines
│  └─ Code-block helpers when cursor in fenced block
│
└─ Journeys
   ├─ A: Quick note writer (Core)
   ├─ B: Docs author (Writer)
   ├─ C: Maintainer/Reviewer (Pro)
   ├─ D: Customize view (Presets/Custom)
   ├─ E: Missing dependency CTA
   └─ F: First‑run onboarding
```

---

# 2) Journey A — Quick Note Writer (Core)

## A1. Editor window with minimal toolbar (Core)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VS Code Menu Bar                                                            │
├─Activity Bar─┬───────────Side Bar (Explorer)───────────┬───Tabs────────────┤
│              │                                          │  notes.md  ▣  x   │
│              └──────────────────────────────────────────┴───────────────────┘
│  Editor: notes.md                                                           │
│  [ editor title bar ]  [$(preview) Preview]  [$(preview) Preview to Side]   │
│  [$(bold)] [$(italic)] [$(list-unordered)/$(list-ordered)] [$(code)]        │
│  [$(link)] [$(image)]                                                       │
│                                                                             │
│  # Meeting notes                                                            │
│  - Agenda                                                                   │
│  - Action items                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Status Bar:  $(check) Core preset   $(gear) Customize
```

* Always-visible Core buttons: preview, basic formatting, list, code, link, image.

## A2. Command Palette affordance (Core)

```
> Markdown: Toggle Preview     Markdown: Preview to the Side
> Markdown Toolbar: Switch Preset   Markdown Toolbar: Customize Buttons
```

---

# 3) Journey B — Docs Author (Writer)

## B1. TOC creation/update flow

```
[ Editor Title Bar: Writer preset ]
[ $(list-ordered) TOC Create ]  [ $(list-ordered) TOC Update ]  [ $(checklist) Task ]  [ $(table) Table ▾ ]

Document (before):
# Guide Title
## Intro
## Install
### MacOS
### Windows

User clicks [TOC Create] → Inserts at top:
<!-- TOC -->
- [Guide Title](#guide-title)
  - [Intro](#intro)
  - [Install](#install)
    - [MacOS](#macos)
    - [Windows](#windows)
<!-- /TOC -->

On heading change, status bar shows:  ⚠ TOC out of date  [Update]
```

## B2. Image insertion (Paste Image installed)

```
[ $(image) ] → submenu:  (1) Insert from Path…  (2) Paste from Clipboard

If (2): Prompt inline
┌ Paste Image ────────────────────────────┐
│ File name: guide-images/diagram.png     │
│ Alt text: architecture diagram          │
│ [Save & Insert] [Cancel]                │
└─────────────────────────────────────────┘
Result: ![architecture diagram](guide-images/diagram.png)
```

## B3. Table tools (visible only in table context)

```
Cursor inside a table → show [ $(table) Table ▾ ] with:
- Insert Table (prompt rows/cols)
- Add Column Left/Right
- Add Row Above/Below
- Align Column: Left | Center | Right
- Format Table (normalize pipes & spacing)
```

---

# 4) Journey C — Maintainer/Reviewer (Pro)

## C1. One‑click lint/fix & problem surfacing

```
[ $(wrench) Fix All ]  [ Lint Workspace ]

User clicks [Fix All] →
- Runs markdownlint.fixAll on active doc
- Toast: “Fixed 12 issues (MD001, MD022, MD032).” [View Problems]
Problems panel lists remaining issues, if any.
```

## C2. Rich preview (MPE installed)

```
[ $(preview) Enhanced Preview ] → splits view, renders math, Mermaid, etc.
```

---

# 5) Journey D — Customize View (Presets & Custom)

## D1. QuickPick: Switch Preset

```
Markdown Toolbar: Switch Preset
○ Core — Minimal essentials
○ Writer — TOC, images, tables, tasks
○ Pro — Lint, workspace ops, enhanced preview
○ Custom — Use my per-button choices
```

## D2. QuickPick: Customize Buttons (multi-select)

```
[ ] Preview (Side)          [ ] Preview (Current)
[ ] Bold  [ ] Italic  [ ] Strikethrough
[ ] List  [ ] Task Toggle  [ ] Code Span  [ ] Code Block
[ ] Insert Link  [ ] Insert Image  [ ] Paste Image (if installed)
[ ] TOC Create  [ ] TOC Update  [ ] TOC Numbers (if MAIO)
[ ] Table Menu (contextual)  [ ] Lint Fix  [ ] Lint Workspace
[Move Up] [Move Down]   [Save]
```

* Saving writes to `mdToolbar.custom.visibleButtons` and updates context keys.

## D3. Settings (JSON/UI)

```
"mdToolbar.preset": "custom",
"mdToolbar.custom.visibleButtons": [
  "preview.side", "bold", "italic", "toc.create", "lint.fix"
],
"mdToolbar.compact": true
```

---

# 6) Journey E — Missing Dependency CTA

```
User clicks [TOC Create] but MAIO not installed →
Toast: “Install ‘Markdown All in One’ to enable TOC.”  [Install] [Dismiss]
(Install button opens Marketplace page in VS Code)
```

---

# 7) Journey F — First‑Run Onboarding (coach marks)

```
Overlay tip 1 → points at toolbar: “Use these to format quickly.”  [Next]
Overlay tip 2 → points at Status Bar ‘Core’: “Switch presets here.”  [Done]
```

---

# 8) Status Bar Micro‑Mode (optional)

```
Status Bar items (compact):
[ $(preview) ] [ B ] [ I ] [ ` ] [ [] ] [ TOC ] [ Img ] [ √Fix ]   Preset: Core▾
Hover shows tooltip + command; click performs action.
```

---

# 9) Mid‑Fidelity Screens (ASCII)

## Screen S1 — Core preset (minimal)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ notes.md                                               [$(preview)] [B][I]│
│                                                                           │
│ # Notes                                                                    │
│ - item                                                                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
Status:  Preset: Core  |  Customize
```

## Screen S2 — Writer preset (contextual Table menu visible)

````
┌───────────────────────────────────────────────────────────────────────────┐
│ guide.md     [$(preview)] [B][I][S] [•/1.] [`/```] [$(link)] [$(image)]   │
│             [TOC] [Table ▾] [Task]                                        │
│                                                                           │
│ | Column A | Column B |                                                    │
│ |---------:|:--------:|                                                    │
│ |   123    |   abc    |   ← cursor here                                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
Status:  TOC out of date [Update]   Preset: Writer
````

## Screen S3 — Pro preset (Problems + Enhanced Preview)

```
┌─────────────┬───────────────────────────────────────────┬─────────────────┐
│ Explorer    │ editor.md                                  │ Enhanced Preview│
│             │ [Fix All] [Lint WS] [Preview(MPE)]         │                 │
│             │ …                                           │  (render)       │
│ Problems ▾  │                                             │                 │
└─────────────┴───────────────────────────────────────────┴─────────────────┘
```

---

# 10) Detailed Components & Specs

## 10.1 Buttons (IDs, labels, icons, conditions)

| ID                 | Label              | Icon                | When (visibility)                           | Executes                                         | Fallback        |
| ------------------ | ------------------ | ------------------- | ------------------------------------------- | ------------------------------------------------ | --------------- |
| `preview.side`     | Preview (Side)     | `$(preview)`        | `editorLangId == markdown`                  | `markdown.showPreviewToSide`                     | –               |
| `fmt.bold`         | Bold               | `$(bold)`           | `markdown && (preset≥Core)`                 | MAIO `toggleBold` or wrap `**…**`                | Internal toggle |
| `fmt.italic`       | Italic             | `$(italic)`         | `markdown && (preset≥Core)`                 | MAIO `toggleItalic` or wrap `*…*`                | Internal toggle |
| `list.toggle`      | Bullet/Number      | `$(list-unordered)` | `markdown && (preset≥Core)`                 | MAIO `toggleList`                                | Internal toggle |
| `code.inline`      | Code               | `` ` ``             | `markdown && (preset≥Core)`                 | MAIO `toggleCodeSpan`                            | Internal        |
| `code.block`       | Code Block         | `$(terminal)`       | `markdown && (preset≥Core)`                 | MAIO `toggleCodeBlock`                           | Internal        |
| `link.insert`      | Insert Link        | `$(link)`           | `markdown && (preset≥Core)`                 | built-in link flow                               | Internal        |
| `image.insert`     | Insert/Paste Image | `$(image)`          | `markdown && (preset≥Writer)`               | Paste Image `extension.pasteImage`               | Path picker     |
| `toc.create`       | TOC Create         | `$(list-ordered)`   | `markdown && hasMAIO && (preset≥Writer)`    | MAIO TOC create                                  | CTA install     |
| `toc.update`       | TOC Update         | `$(list-ordered)`   | same                                        | MAIO TOC update                                  | CTA install     |
| `table.menu`       | Table ▾            | `$(table)`          | `markdown && inTable && (preset≥Writer)`    | open submenu                                     | –               |
| `task.toggle`      | Task Toggle        | `$(checklist)`      | `markdown && onTaskLine && (preset≥Writer)` | toggle `- [ ]`/`- [x]`                           | Internal        |
| `lint.fix`         | Fix All            | `$(wrench)`         | `markdown && hasMarkdownlint && preset=Pro` | `markdownlint.fixAll`                            | CTA install     |
| `lint.workspace`   | Lint Workspace     | `$(wrench)`         | `hasMarkdownlint && preset=Pro`             | `markdownlint.lintWorkspace`                     | CTA install     |
| `preview.mpe.side` | Enhanced Preview   | `$(preview)`        | `hasMPE && preset=Pro`                      | `markdown-preview-enhanced.openPreviewToTheSide` | CTA install     |

## 10.2 Context Keys

* `mdToolbar.hasMAIO`, `mdToolbar.hasMarkdownlint`, `mdToolbar.hasPasteImage`, `mdToolbar.hasMPE`
* `mdToolbar.preset` in {`core`,`writer`,`pro`,`custom`}
* `mdToolbar.inTable`, `mdToolbar.onTaskLine`

## 10.3 QuickPick Data Models

* `PresetOption = { id: 'core'|'writer'|'pro'|'custom', label, description }`
* `ButtonOption = { id, label, group: 'format'|'structure'|'media'|'quality'|'preview', requires?: extId }`

## 10.4 Error/Empty States

* Missing ext → toast with \[Install] deep‑link
* No buttons in Custom → show inline hint: “No buttons selected. Open Customize.”
* Fix All completes with 0 fixes → info toast “No issues found.”

## 10.5 Accessibility & Keyboard

* Every button has tooltip + ARIA label + command palette alias
* Respect theme contrast; use codicons for 1‑color clarity
* Don’t override default keybindings without explicit opt‑in

---

# 11) Implementation Notes (non‑visual)

* Lazy activation: only on `*.md` and command execution
* Persist last used preset per workspace
* Provide JSON schema for settings to aid IntelliSense
* Keep button groups stable to build muscle memory

---

# 12) Next Steps

* Choose initial default set per preset
* Validate with 5–8 user tasks (note, docs, review) and time‑to‑action
* Iterate on table submenu and TOC status surfaced via status bar

