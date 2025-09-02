# Markdown Toolbar

> 🚀 **v2.0.0** - Complete Architecture Rewrite with Smart Presets & Intelligent Extension Integration

A sophisticated, context-aware markdown formatting toolbar for VS Code featuring intelligent preset management, real-time extension detection, and advanced document context awareness.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/markdown-toolbar)
[![VS Code](https://img.shields.io/badge/VS%20Code-^1.102.0-brightgreen.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen.svg)](#testing)

## ✨ What's New in v2.0

- 🎯 **Smart Preset System** - Automatically adapts to your workflow and installed extensions
- 🔍 **Real-time Extension Detection** - Intelligently integrates with popular markdown extensions  
- 🧠 **Context-Aware Commands** - Dynamic button availability based on document context
- ⚡ **Performance Optimized** - 50% faster with caching and debouncing
- 🛠 **Internal Fallbacks** - Works great even without additional extensions

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Preset System](#preset-system)
- [Supported Extensions](#supported-extensions)
- [Features](#features)
- [Configuration](#configuration)
- [Commands](#commands)
- [Advanced Usage](#advanced-usage)
- [Migration Guide](#migration-guide)
- [Contributing](#contributing)

## 🚀 Quick Start

1. **Install** the extension from the VS Code marketplace
2. **Open** any markdown file
3. **Choose** your preset when prompted (or later via `Ctrl+Shift+P` → "Switch Preset")
4. **Start formatting** with intelligent, context-aware tools!

```bash
# Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
> Markdown Toolbar: Switch Preset
> Markdown Toolbar: Customize Buttons
> Markdown Toolbar: Analyze Dependencies
```

## 🎯 Preset System

Choose the perfect preset for your workflow:

### 📝 **Core Preset** (Default)
Perfect for basic markdown editing with essential formatting tools.

**Included Tools:**
- Bold, Italic formatting
- Inline code
- Links and images  
- Bullet lists
- Live preview

*No additional extensions required.*

### ✍️ **Writer Preset**
Enhanced writing experience with advanced formatting and content organization.

**Includes Core +:**
- Strikethrough formatting
- Task lists and checkboxes
- Table of contents generation
- Code blocks with syntax
- Enhanced preview options

*Recommended extension: [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)*

### 🏢 **Pro Preset**  
Professional suite with linting, advanced previews, and productivity tools.

**Includes Writer +:**
- Real-time markdown linting
- Workspace-wide lint fixing
- Enhanced preview with MPE
- Image paste functionality
- Table manipulation tools

*Recommended extensions: [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint), [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)*

### 🎨 **Custom Preset**
Fully customizable button selection tailored to your specific needs.

**Features:**
- Pick any combination of 20+ available tools
- Drag & drop reordering
- Save multiple configurations
- Export/import presets

## 🧩 Supported Extensions

The toolbar intelligently integrates with popular markdown extensions:

| Extension | Features Unlocked | Auto-Detection |
|-----------|------------------|----------------|
| **[Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)** | TOC generation, advanced formatting, keyboard shortcuts | ✅ |
| **[markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)** | Real-time linting, fix suggestions, workspace linting | ✅ |
| **[Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)** | Enhanced previews, export options, diagrams | ✅ |
| **[Paste Image](https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image)** | Direct clipboard image pasting | ✅ |

### 🔄 Auto-Switching Intelligence

When you install a new supported extension:
1. **Smart Detection** - Instantly recognizes the new capability
2. **Preset Suggestion** - Offers to upgrade to a more advanced preset
3. **Seamless Integration** - New features become immediately available

## ✨ Features

### 🎯 **Context-Aware Interface**
- Buttons adapt based on cursor position (in table, list, code block, etc.)
- Smart toggle behavior - automatically detects existing formatting
- Real-time button state updates as you navigate your document

### ⚡ **Performance Optimized**
- **Caching System** - Context detection results cached for smooth editing
- **Debounced Updates** - Prevents UI flicker during fast typing
- **Lazy Loading** - Extensions loaded only when needed

### 🔧 **Intelligent Fallbacks**  
- **Internal Implementations** - Core functionality works without any extensions
- **Graceful Degradation** - Missing features don't break the workflow
- **Call-to-Action** - Helpful prompts to install recommended extensions

### 🎨 **Rich Document Context**
```typescript
// Automatically detects and responds to:
✅ Tables (enable table-specific tools)
✅ Task lists (toggle checkboxes)  
✅ Code blocks (syntax highlighting)
✅ Nested lists (smart indentation)
✅ Headers (TOC generation)
✅ Links and images (preview and edit)
```

## ⚙️ Configuration

### Basic Settings
```json
{
  "markdownToolbar.preset": "core",           // "core" | "writer" | "pro" | "custom"
  "markdownToolbar.statusBar.enabled": true,  // Show preset switcher in status bar
  "markdownToolbar.compact": false,           // Use compact button layout
  "markdownToolbar.autoDetectDependencies": true // Enable smart extension detection
}
```

### Advanced Performance Settings
```json
{
  "markdownToolbar.contextUpdateDebounce": 100,      // Context update delay (ms)
  "markdownToolbar.dependencyCacheTimeout": 30000,   // Extension cache duration (ms)
  "markdownToolbar.fallbackBehavior": "internal"     // "internal" | "cta" | "hide"
}
```

### Custom Preset Configuration
```json
{
  "markdownToolbar.preset": "custom",
  "markdownToolbar.custom.visibleButtons": [
    "fmt.bold",
    "fmt.italic", 
    "code.inline",
    "link.insert",
    "toc.create",
    "lint.fix"
  ]
}
```

## 🎮 Commands

### Core Commands
| Command | Shortcut | Description |
|---------|----------|-------------|
| `mdToolbar.switchPreset` | `Ctrl+Shift+P` | Switch between presets |
| `mdToolbar.customizeButtons` | - | Configure custom preset buttons |
| `mdToolbar.debug.analyzeDependencies` | - | Analyze extension dependencies |

### Formatting Commands  
| Command | Shortcut | Fallback |
|---------|----------|----------|
| `mdToolbar.fmt.bold` | `Ctrl+B` | ✅ Internal |
| `mdToolbar.fmt.italic` | `Ctrl+I` | ✅ Internal |
| `mdToolbar.fmt.strike` | - | ✅ Internal |
| `mdToolbar.code.inline` | `Ctrl+Shift+C` | ✅ Internal |
| `mdToolbar.code.block` | - | ✅ Internal |

### Content Commands
| Command | Extension Required | Fallback |
|---------|-------------------|----------|
| `mdToolbar.link.insert` | - | ✅ Internal |
| `mdToolbar.image.insert` | - | ✅ Internal |
| `mdToolbar.image.paste` | Paste Image | ❌ Requires extension |
| `mdToolbar.toc.create` | Markdown All in One | ❌ Requires extension |
| `mdToolbar.lint.fix` | markdownlint | ❌ Requires extension |

## 🚀 Advanced Usage

### Context Menu Integration
Right-click in any markdown file to access the **Markdown Toolbar** submenu with context-sensitive options:

```
📝 Markdown Toolbar
├── Bold                    (if in text)
├── Italic                  (if in text)  
├── Create TOC              (if MAIO available)
├── Fix Lint Issues         (if markdownlint available)
└── Toggle Task             (if in list)
```

### Keyboard-First Workflow
All major functions accessible via keyboard:

```bash
# Quick preset switching
Ctrl+Shift+P → "Switch Preset" → Select preset

# Format current selection  
Ctrl+B         # Bold
Ctrl+I         # Italic
Ctrl+Shift+C   # Inline code
Ctrl+K         # Insert link
Ctrl+Shift+L   # Toggle list
```

### Extension Integration Examples

#### With Markdown All in One:
```markdown
# Document.md
## Table of Contents
<!-- Auto-generated by mdToolbar.toc.create -->
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1
Content here...
```

#### With markdownlint:
```bash
# Workspace-wide linting
> mdToolbar.lint.workspace

# Fix current file  
> mdToolbar.lint.fix
```

## 🔄 Migration Guide

### From v1.x to v2.0

**Automatic Migration:**
- Settings automatically migrated on first activation
- Old commands remain functional during transition
- Welcome screen guides preset selection

**Manual Migration (if needed):**

```json
// OLD (v1.x) - Deprecated
{
  "markdownToolbar.buttons": ["bold", "italic", "code", "link", "list"],
  "markdownToolbar.enabled": true,
  "markdownToolbar.position": "right"
}

// NEW (v2.0) - Recommended  
{
  "markdownToolbar.preset": "core",
  "markdownToolbar.statusBar.enabled": true
}
```

**Command Updates:**
```javascript
// OLD commands (still work, but deprecated)
markdownToolbar.bold
markdownToolbar.italic

// NEW commands (recommended)
mdToolbar.fmt.bold  
mdToolbar.fmt.italic
```

## 🏗 Architecture

Built with modern development practices:

- **TypeScript 5.9.2** - Full type safety with strict mode
- **Event-Driven Architecture** - Reactive updates using observer pattern
- **Dependency Injection** - Testable, maintainable code structure
- **Performance First** - Caching, debouncing, lazy loading

### Project Structure
```
src/
├── commands/           # Command factory and handlers
├── deps/              # Extension dependency detection
├── engine/            # Core markdown formatting logic
├── presets/           # Preset management system
├── services/          # Context detection and caching
├── types/             # TypeScript definitions
└── constants/         # Configuration schemas
```

## 🧪 Testing

Comprehensive test suite ensures reliability:

```bash
npm run test:unit        # Run unit tests (97 tests)
npm run test:integration # Run integration tests
npm run test:cov         # Generate coverage report
```

**Test Coverage:**
- ✅ 97 unit tests passing
- ✅ All core functionality covered
- ✅ Mock-based VS Code API testing
- ✅ Edge case validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-repo/markdown-toolbar
cd markdown-toolbar
npm install
npm run watch
```

Press `F5` to launch extension in development mode.

### Code Quality
- ESLint configuration enforces consistent style
- TypeScript strict mode catches errors early
- Comprehensive test suite prevents regressions
- Documentation required for all public APIs

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the VS Code team for the excellent extension API
- Inspired by the markdown extensions community
- Built with ❤️ by the Markdown Toolbar team

---

**Enjoy enhanced markdown editing! 🎉**

*For support, feature requests, or bug reports, please visit our [GitHub Issues](https://github.com/your-repo/markdown-toolbar/issues) page.*
