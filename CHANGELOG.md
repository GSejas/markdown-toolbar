# Changelog

All notable changes to the Markdown Toolbar extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-09-03

### ✨ Added

#### **Context Menu Integration**

- **7 Organized Categories**: Complete right-click context menu with logical grouping
  - 📝 **Format Text**: Bold, italic, strikethrough, code, highlight
  - 🏗️ **Structure**: Headings, lists, blockquotes, code blocks, horizontal rules
  - ➕ **Insert**: Links, images, footnotes, math, Mermaid diagrams, tables
  - 👁️ **Preview**: Standard and enhanced preview options
  - 🔧 **Tools & Quality**: TOC operations, linting
  - ⚙️ **Editor Features**: Word wrap, line numbers, minimap, navigation, search
  - 📤 **Export & Share**: PDF export, Git operations
- **Smart Visibility**: Menu items only show when relevant extensions are available
- **Context-Aware Options**: Dynamic menu based on cursor position and document context

#### **New Button Types & Features**

- **Editor Features**: Word wrap toggle, line numbers, minimap controls
- **PDF Export**: Direct PDF export with markdown-pdf extension integration
- **Navigation Tools**: Symbol navigation, document outline, search & replace
- **Git Integration**: Status checking, commit, and diff operations
- **Enhanced Extension Support**: Added markdown-pdf extension detection

#### **Modernized Architecture Components**

- **DocumentCache**: Intelligent document caching with LRU eviction and version tracking
- **ErrorBoundary**: Graceful error handling for provider failures
- **ServiceContainer**: Dependency injection system for better testability
- **PerformanceMonitor**: Instrumentation and timing analysis for optimization
- **CodeLens Display Modes**: Minimal vs explicit text options to reduce visual clutter

#### **CodeLens Enhancements**

- **Display Mode Setting**: Toggle between minimal icons and full text descriptions
- **Simplified Interface**: Reduced visual clutter with configurable display options
- **Cleaned Provider Actions**: Removed non-functional table sort/align operations

#### **Command System Expansion**

- **25+ New Commands**: Complete command coverage for all toolbar features
- **Command Organization**: Logical grouping with consistent naming (`mdToolbar.*`)
- **Extension-Aware Commands**: Automatic fallback behavior when extensions unavailable

### 🔄 Changed

#### **Documentation Improvements**

- **Visual Documentation**: Added diagrams, flowcharts, and visual aids
- **Simplified Examples**: Cleaner code examples with better formatting
- **Comprehensive README**: Complete rewrite with modern structure and visuals
- **Architecture Documentation**: Enhanced with diagrams and implementation details
- **Professional Banners**: Created SVG banners for documentation with multiple themes

#### **Toolbar Designer Updates**

- **Comprehensive Button Library**: Updated to include all 70+ current buttons
- **Codicons Integration**: Migrated from custom MyIcons to VS Code's built-in Codicons
- **Enhanced Export**: Added telemetry export for usage analytics and bug reporting
- **Test Presets**: Complete preset testing functionality

#### **Code Quality**

- **ESLint Fixes**: Resolved all linting warnings and errors
- **Type Safety**: Enhanced TypeScript usage throughout codebase
- **Performance**: Optimized context menu generation and command execution

### 🐛 Bug Fixes

- Fixed missing command definitions for context menu items
- Resolved extension detection timing issues
- Improved error handling for missing dependencies
- Fixed context menu visibility conditions
- **Table CodeLens Cleanup**: Removed non-functional sort and align table actions
- **Font Rendering**: Fixed MyIcons font family conflicts with body text
- **Icon Compatibility**: Resolved icon parsing issues with mixed icon formats

### 📖 Documentation

- Complete README overhaul with modern design
- Added visual diagrams and flowcharts
- Simplified code examples and usage instructions
- Enhanced architecture documentation
- Updated CHANGELOG with recent changes

---

## [2.0.0] - 2024-12-XX

### 🎉 Major Release - Complete Architecture Rewrite

This release represents a complete rewrite of the Markdown Toolbar extension with modern architecture, intelligent preset management, and advanced dependency detection.

### ✨ Features

#### **Preset System**

- **4 Built-in Presets**: Core, Writer, Pro, and Custom
  - **Core**: Essential formatting tools (bold, italic, code, links, lists)
  - **Writer**: Writing-focused with TOC and advanced formatting
  - **Pro**: Professional suite with linting and enhanced previews
  - **Custom**: User-defined button selection
- **Smart Auto-Switching**: Automatically suggests preset upgrades when new extensions are installed
- **Preset Switcher**: Quick preset switching via command palette or status bar

#### **Intelligent Dependency Detection**

- **Real-time Extension Monitoring**: Detects when markdown extensions are installed/removed
- **Extension State Tracking**: Distinguishes between installed, active, and disabled extensions
- **Supported Extensions**:
  - Markdown All in One (yzhang.markdown-all-in-one)
  - markdownlint (DavidAnson.vscode-markdownlint)
  - Markdown Preview Enhanced (shd101wyy.markdown-preview-enhanced)
  - Paste Image (mushan.vscode-paste-image)
- **Dependency Analysis Tool**: Debug command to analyze current extension state

#### **Advanced Context Detection**

- **Document Context Awareness**: Detects tables, task lists, code blocks, and formatting context
- **Performance Optimized**: Caching and debouncing for smooth editing experience
- **Real-time Updates**: Context-sensitive button availability

#### **Comprehensive Command System**

- **25+ New Commands**: Complete `mdToolbar.*` command structure
- **Command Delegation**: Intelligently delegates to extension commands when available
- **Fallback System**: Internal implementations when extensions aren't available
- **Context-Aware Menus**: Dynamic menu visibility based on current context and available extensions

#### **Fallback Implementations**

- **Internal Markdown Engine**: Complete formatting capabilities without dependencies
- **Smart Fallback Behavior**: Configurable fallback strategies
  - `internal`: Use built-in implementations
  - `cta`: Show call-to-action to install extensions
  - `hide`: Hide unavailable buttons
- **Atomic Operations**: Undo-friendly single-operation edits

#### **Enhanced Configuration**

- **Rich Settings Schema**: 12 new configuration options with validation
- **Performance Tuning**: Configurable debounce and cache timeouts
- **Behavior Customization**: Fine-tune extension behavior
- **Migration Support**: Automatic migration from v1.x settings

#### **User Experience**

- **Welcome Experience**: First-time user onboarding with preset selection
- **Smart Notifications**: Context-aware suggestions and error messages
- **Extension Integration**: One-click extension installation prompts
- **Keyboard Shortcuts**: Improved keybinding support

### 🔄 Changed

#### **Command Structure**

- **BREAKING**: Migrated from `markdownToolbar.*` to `mdToolbar.*` commands
- **Improved Naming**: More consistent and descriptive command names
- **Better Organization**: Commands grouped by functionality

#### **Settings Structure**

- **BREAKING**: New configuration schema with `markdownToolbar.preset` as primary setting
- **Enhanced Validation**: Strict validation with helpful error messages
- **Better Defaults**: Intelligent default values based on available extensions

#### **Performance**

- **50% Faster Context Detection**: Optimized algorithms with caching
- **Reduced Memory Usage**: Efficient resource management and cleanup
- **Smoother UI**: Debounced updates prevent UI flicker

### 🛠 Technical Improvements

#### **Architecture**
- **Modern TypeScript**: Full TypeScript rewrite with strict mode
- **Dependency Injection**: Testable architecture with proper separation of concerns
- **Event-Driven Design**: Reactive updates using observer pattern
- **Modular Structure**: Clean separation between engine, services, and UI

#### **Testing**
- **97 Unit Tests**: Comprehensive test coverage
- **Mock-Based Testing**: Isolated unit tests with proper mocking
- **Integration Tests**: End-to-end testing of core workflows
- **CI/CD Ready**: Automated testing and validation

#### **Code Quality**
- **ESLint Integration**: Enforced code quality standards
- **Type Safety**: 100% TypeScript with strict type checking
- **Documentation**: Comprehensive inline documentation and examples
- **Error Handling**: Robust error handling with user-friendly messages

### 📦 Dependencies

#### **Runtime Dependencies**
- VS Code Engine: `^1.102.0`
- No external runtime dependencies (self-contained)

#### **Development Dependencies**
- TypeScript 5.9.2
- ESLint 9.32.0
- Vitest 3.2.4 (testing framework)
- esbuild 0.25.8 (bundling)

### 📋 Configuration Options

```json
{
  "markdownToolbar.preset": "core",
  "markdownToolbar.custom.visibleButtons": [],
  "markdownToolbar.compact": false,
  "markdownToolbar.statusBar.enabled": true,
  "markdownToolbar.autoDetectDependencies": true,
  "markdownToolbar.fallbackBehavior": "internal",
  "markdownToolbar.contextUpdateDebounce": 100,
  "markdownToolbar.dependencyCacheTimeout": 30000
}
```

### 🚀 Commands

#### **Core Commands**
- `mdToolbar.switchPreset` - Switch between presets
- `mdToolbar.customizeButtons` - Configure custom preset
- `mdToolbar.debug.analyzeDependencies` - Analyze extension dependencies

#### **Formatting Commands**
- `mdToolbar.fmt.bold` - Toggle bold formatting
- `mdToolbar.fmt.italic` - Toggle italic formatting  
- `mdToolbar.fmt.strike` - Toggle strikethrough formatting

#### **Structure Commands**
- `mdToolbar.list.toggle` - Toggle bullet list
- `mdToolbar.task.toggle` - Toggle task list
- `mdToolbar.code.inline` - Toggle inline code
- `mdToolbar.code.block` - Insert code block

#### **Content Commands**
- `mdToolbar.link.insert` - Insert link
- `mdToolbar.image.insert` - Insert image
- `mdToolbar.image.paste` - Paste image (requires extension)

#### **Advanced Commands** (Pro preset)
- `mdToolbar.toc.create` - Create table of contents
- `mdToolbar.toc.update` - Update table of contents
- `mdToolbar.lint.fix` - Fix markdown lint issues
- `mdToolbar.preview.mpe.side` - Preview with MPE

### 🔧 Migration Guide

#### **From v1.x to v2.0**

**Settings Migration:**
```json
// v1.x (deprecated)
{
  "markdownToolbar.buttons": ["bold", "italic", "code"]
}

// v2.0 (new)
{
  "markdownToolbar.preset": "core"
}
```

**Command Migration:**
```javascript
// v1.x commands (deprecated)
markdownToolbar.bold
markdownToolbar.italic

// v2.0 commands (new)
mdToolbar.fmt.bold
mdToolbar.fmt.italic
```

**Automatic Migration:**
- Settings are automatically migrated on first run
- Old commands remain functional during transition period
- Welcome dialog helps users choose appropriate preset

### 🐛 Bug Fixes
- Fixed context detection in nested markdown structures
- Resolved memory leaks in extension monitoring
- Improved error handling for malformed documents
- Fixed keybinding conflicts with other extensions

### 📖 Documentation
- Complete README with usage examples
- Comprehensive API documentation
- Architecture decision records
- Contributing guidelines

### ⚠️ Breaking Changes
- **Command Structure**: All commands renamed from `markdownToolbar.*` to `mdToolbar.*`
- **Settings Schema**: Primary configuration moved to `markdownToolbar.preset`
- **Minimum VS Code**: Requires VS Code 1.102.0 or later
- **Node.js**: Development requires Node.js 16+ for building

### 🔮 What's Next
- Status bar UI improvements
- Additional preset customization options
- Integration with more markdown extensions
- Performance optimizations
- Mobile/web support

---

## [1.0.0] - 2024-01-XX

### Initial Release
- Basic markdown formatting buttons
- Status bar integration
- Simple configuration options
- Support for common markdown operations

---

### Legend
- 🎉 Major feature
- ✨ New feature
- 🔄 Changed
- 🛠 Technical improvement
- 📦 Dependency
- 🐛 Bug fix
- 📖 Documentation
- ⚠️ Breaking change
- 🔮 Future feature