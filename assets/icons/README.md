# Icon Set Documentation

This directory contains SVG icons for all Markdown Extended Toolbar commands in the VS Code extension.

## Icon Categories

### Format Icons

- `fmt-bold.svg` - Bold text formatting (B icon)
- `fmt-italic.svg` - Italic text formatting (I icon)
- `fmt-strike.svg` - Strikethrough text formatting (strikethrough lines)

### Structure Icons

- `list-toggle.svg` - Toggle bulleted/numbered lists (bullet points with lines)
- `task-toggle.svg` - Toggle task list items (checkboxes with lines)

### Code Icons

- `code-inline.svg` - Inline code formatting (backticks/code span)
- `code-block.svg` - Code block formatting (terminal/code block)

### Media Icons

- `link-insert.svg` - Insert/edit links (chain link icon)
- `image-insert.svg` - Insert image from file (image/photo icon)
- `image-paste.svg` - Paste image from clipboard (clipboard with image)

### Preview Icons

- `preview-side.svg` - Open preview in side panel (split view)
- `preview-current.svg` - Open preview in current tab (single view with preview)
- `preview-mpe-side.svg` - Enhanced preview in side panel (split view with enhancement badge)
- `preview-mpe-current.svg` - Enhanced preview in current tab (single view with enhancement badge)

### Table of Contents Icons

- `toc-create.svg` - Create table of contents (hierarchical list)
- `toc-update.svg` - Update existing TOC (hierarchical list with refresh arrow)
- `toc-add-numbers.svg` - Add section numbers to TOC (numbered list)
- `toc-remove-numbers.svg` - Remove section numbers from TOC (list with removal indicator)

### Table Icons

- `table-menu.svg` - Table formatting options (grid/table icon)

### Quality Icons

- `lint-fix.svg` - Fix markdown linting issues (wrench/fix tool)
- `lint-workspace.svg` - Lint entire workspace (multiple files with fix tool)

## Icon Specifications

- **Format**: SVG (Scalable Vector Graphics)
- **Size**: 24x24 pixels viewBox
- **Style**: Outline style with 2px stroke width
- **Color**: Uses `currentColor` for proper theming
- **Design**: Clean, minimal, consistent with VS Code design language

## Usage in Extension

These icons can be used in the VS Code extension by:

1. **Status Bar Items**: Reference the SVG files in the `icon` property
2. **Icon Fonts**: Convert to WOFF format using the custom icon generation guide
3. **VS Code Icons**: Register as custom icons in package.json

### Example Usage

```typescript
// Status bar item with custom SVG icon
const statusBarItem = vscode.window.createStatusBarItem();
statusBarItem.text = "$(bold)"; // VS Code built-in icon
// OR with custom icon path
statusBarItem.iconPath = vscode.Uri.file(path.join(extensionPath, 'assets/icons/fmt-bold.svg'));
```

### Converting to Icon Font

Use the guide in `docs/custom-icons-guide.md` to convert these SVGs to a WOFF icon font for optimal performance and consistency.

## Design Principles

1. **Consistency**: All icons follow the same design patterns and stroke weights
2. **Clarity**: Icons are readable at small sizes (16px, 24px)
3. **Accessibility**: High contrast and clear shapes for all users
4. **Theming**: Uses `currentColor` to adapt to VS Code themes
5. **Semantic**: Each icon visually represents its function clearly

## File Naming Convention

Icons are named using the pattern: `{category}-{action}.svg`

- `fmt-` prefix for formatting commands
- `list-`, `task-` for structure commands  
- `code-` for code-related commands
- `image-`, `link-` for media commands
- `preview-` for preview commands
- `toc-` for table of contents commands
- `table-` for table commands
- `lint-` for quality/linting commands

This naming matches the ButtonId system used in the extension code.
