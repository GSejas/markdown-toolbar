# 📝 Markdown Toolbar

> **Smart, Context-Aware Markdown Editing for VS Code**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/GSejas/markdown-toolbar)
[![VS Code](https://img.shields.io/badge/VS%20Code-^1.102.0-brightgreen.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

A powerful VS Code extension that provides intelligent markdown formatting tools with real-time context awareness and seamless extension integration.

## ✨ Key Features

### 🎯 Smart Context Detection

- Automatically detects cursor position and document context
- Buttons adapt based on current selection and content
- Works seamlessly with popular markdown extensions

### 🛠️ Comprehensive Toolset

- **Text Formatting**: Bold, italic, strikethrough, inline code, highlight
- **Document Structure**: Headings, lists, blockquotes, code blocks, tables
- **Media & Links**: Image insertion, link creation, footnote support
- **Advanced Features**: Math expressions, Mermaid diagrams, TOC generation

### 🔧 Context Menu Integration

Right-click in any markdown file to access organized formatting options:

```bash
📝 Format Text    🏗️ Structure    ➕ Insert    ⚙️ Editor Features
├── Bold          ├── Headings    ├── Links   ├── Word Wrap
├── Italic        ├── Lists       ├── Images  ├── Line Numbers
├── Code          ├── Blockquotes ├── Tables  └── Minimap
└── Highlight     └── Code Blocks └── Footnotes
```

## 🚀 Quick Start

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Markdown Toolbar"
4. Click **Install**

### First Use

1. Open any `.md` file
2. Right-click to see the context menu
3. Start formatting with intelligent tools!

```bash
# Quick commands
Ctrl+Shift+P → "Markdown Toolbar: Switch Preset"
Ctrl+Shift+P → "Markdown Toolbar: Analyze Dependencies"
```

## 🎨 Visual Examples

### Basic Formatting

```markdown
# Start with plain text
This is regular text content.

# Apply formatting
**This becomes bold text**
*This becomes italic text*
`This becomes inline code`
```

### Advanced Features

```markdown
# Tables
| Feature | Status |
|---------|--------|
| Context Menu | ✅ |
| PDF Export | ✅ |

# Code Blocks
```javascript
function formatText(text) {
  return `**${text}**`; // Bold formatting
}
```
```

## ⚙️ Configuration

### Basic Settings

```json
{
  "markdownToolbar.preset": "core",
  "markdownToolbar.statusBar.enabled": true,
  "markdownToolbar.autoDetectDependencies": true
}
```

### Advanced Options

```json
{
  "markdownToolbar.contextUpdateDebounce": 100,
  "markdownToolbar.fallbackBehavior": "internal",
  "markdownToolbar.showMissingExtensionNotifications": true
}
```

## 🧩 Extension Compatibility

| Extension | Features Unlocked | Status |
|-----------|------------------|---------|
| **Markdown All in One** | TOC, Advanced Formatting | ✅ Auto-detected |
| **markdownlint** | Real-time Linting | ✅ Auto-detected |
| **Markdown Preview Enhanced** | Enhanced Previews | ✅ Auto-detected |
| **Paste Image** | Direct Image Pasting | ✅ Auto-detected |
| **markdown-pdf** | PDF Export | ✅ Auto-detected |

## 📊 Architecture Overview

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Layer  │    │ Command     │    │ Engine      │
│             │    │ Layer       │    │ Layer       │
│ • Status Bar│◄──►│ • Factory   │◄──►│ • Formatting│
│ • Context   │    │ • Context   │    │ • Context   │
│   Menu      │    │   Detection │    │   Detection │
└─────────────┘    └─────────────┘    └─────────────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
               ┌─────────────┐
               │ Service     │
               │ Layer       │
               │             │
               │ • Extension │
               │   Detection │
               │ • Caching   │
               └─────────────┘
```

## 🧪 Testing & Quality

### Test Coverage

- ✅ **Unit Tests**: 230+ tests passing
- ✅ **Integration Tests**: 9 tests passing
- ✅ **TypeScript**: 100% type safety
- ✅ **ESLint**: Code quality enforcement

### Quality Assurance

- **Automated Testing**: CI/CD integration
- **Performance Monitoring**: Optimized for large documents
- **Extension Compatibility**: Verified with popular extensions

## 🎮 Usage Examples

### Context Menu Workflow

```bash
# 1. Open markdown file
# 2. Right-click anywhere
# 3. Choose from categories:
#    - Format Text (bold, italic, code)
#    - Structure (headings, lists)
#    - Insert (links, images, tables)
#    - Tools (lint, preview)
# 4. Formatting applied instantly
```

### Keyboard Shortcuts

```bash
Ctrl+B         # Bold
Ctrl+I         # Italic
Ctrl+Shift+C   # Inline code
Ctrl+K         # Insert link
Ctrl+Shift+L   # Toggle list
```

## 🔧 Development

### Setup

```bash
git clone https://github.com/GSejas/markdown-toolbar
cd markdown-toolbar
npm install
npm run watch
```

### Build Commands

```bash
npm run compile      # Type check + lint + build
npm run test         # Run all tests
npm run package      # Production build
```

### Project Structure

```text
src/
├── commands/        # Command implementations
├── engine/          # Core formatting logic
├── services/        # Extension detection & caching
├── types/           # TypeScript definitions
├── ui/              # Status bar & UI components
└── utils/           # Helper functions
```

## 📈 Performance

### Benchmarks

- **Context Detection**: < 50ms for large documents
- **Extension Scanning**: < 100ms on startup
- **Memory Usage**: < 10MB additional
- **UI Responsiveness**: 60fps smooth interaction

### Optimizations

- **Smart Caching**: Document analysis results cached
- **Debounced Updates**: Prevents UI flicker during typing
- **Lazy Loading**: Extensions loaded on-demand
- **Atomic Operations**: Undo-friendly single edits

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Ways to Contribute

- 🐛 **Bug Reports**: Use GitHub Issues
- ✨ **Feature Requests**: Suggest new capabilities
- 📖 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add test cases or improve coverage
- 💻 **Code**: Submit pull requests

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm run test
npm run lint

# 4. Submit pull request
```

## 📄 License

**MIT License** - Free for personal and commercial use

## 🙏 Acknowledgments

- **VS Code Team**: For the excellent extension API
- **Markdown Community**: For inspiration and standards
- **Contributors**: For making this project better

---

Made with ❤️ for the Markdown community

[⭐ Star on GitHub](https://github.com/GSejas/markdown-toolbar) • [🐛 Report Issues](https://github.com/GSejas/markdown-toolbar/issues)
