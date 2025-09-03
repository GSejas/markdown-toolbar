# 🤝 Contributing to Markdown Toolbar Extension

Thank you for your interest in contributing! This guide will help you get started with contributing to the Markdown Toolbar extension.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Run** tests: `npm test`
5. **Make** your changes
6. **Submit** a pull request

## 📋 Development Setup

### Prerequisites
- **Node.js** 18+ and npm
- **VS Code** for testing
- **Git** for version control

### Installation
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vscode-markdown-toolbar.git
cd vscode-markdown-toolbar

# Install dependencies
npm install

# Build the extension
npm run compile

# Run tests
npm test

# Package for testing
npm run package
```

### Testing Your Changes
1. **Press F5** in VS Code to launch Extension Development Host
2. **Open a markdown file** to see the toolbar
3. **Test your changes** thoroughly
4. **Run unit tests**: `npm test`
5. **Run integration tests**: `npm run test:integration`

## 🐛 Reporting Issues

### Before Reporting
- [ ] Search existing issues to avoid duplicates
- [ ] Update to the latest version
- [ ] Test with other extensions disabled

### Issue Template
```markdown
**Bug Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. Expected vs actual behavior

**Environment:**
- VS Code version:
- Extension version:
- OS:
- Other relevant extensions:

**Additional Context:**
Screenshots, error logs, etc.
```

## 🔧 Types of Contributions

### 🐛 Bug Fixes
- Fix reported issues
- Improve error handling
- Performance optimizations

### ✨ New Features
- New toolbar buttons
- Additional markdown features
- Integration with other extensions

### 📚 Documentation
- Improve README
- Add code comments
- Update guides and tutorials

### 🎨 UI/UX Improvements
- Better button icons
- Improved toolbar design
- Enhanced user experience

## 📝 Code Style Guidelines

### TypeScript
- Use **TypeScript** for all code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Include **JSDoc comments** for public APIs

### Naming Conventions
```typescript
// Classes: PascalCase
export class StatusBarToolbar { }

// Interfaces: PascalCase with 'I' prefix
export interface IMarkdownContext { }

// Functions: camelCase
function toggleBoldFormatting() { }

// Constants: SCREAMING_SNAKE_CASE
const BUTTON_DEFINITIONS = { };

// Files: kebab-case
// button-definitions.ts
// context-service.ts
```

### Code Structure
```typescript
/**
 * Brief description of the module
 * @since 1.0.0
 */

// Imports first
import * as vscode from 'vscode';
import { IMarkdownContext } from './types';

// Constants
const DEFAULT_CONFIG = { };

// Interfaces and types
export interface IMyInterface { }

// Main class/function
export class MyClass {
    // Private properties first
    private readonly config: any;
    
    // Constructor
    constructor() { }
    
    // Public methods
    public async activate(): Promise<void> { }
    
    // Private methods
    private setupEventListeners(): void { }
}
```

## 🧪 Testing Guidelines

### Unit Tests
```typescript
// test/unit/my-feature.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyFeature } from '../../src/features/my-feature';

describe('MyFeature', () => {
    let feature: MyFeature;
    
    beforeEach(() => {
        feature = new MyFeature();
    });
    
    it('should handle basic functionality', () => {
        // Arrange
        const input = 'test input';
        
        // Act
        const result = feature.process(input);
        
        // Assert
        expect(result).toBe('expected output');
    });
});
```

### Integration Tests
- Test with real VS Code API
- Test button interactions
- Test configuration changes
- Test context detection

## 📦 Pull Request Process

### Before Submitting
- [ ] **Branch** from `main`: `git checkout -b feature/my-feature`
- [ ] **Write tests** for your changes
- [ ] **Run all tests**: `npm test`
- [ ] **Update documentation** if needed
- [ ] **Follow commit conventions** (see below)

### Commit Message Convention
```
type(scope): description

feat(toolbar): add strikethrough button support
fix(context): resolve table detection in nested lists  
docs(readme): update installation instructions
test(unit): add tests for preset switching
refactor(commands): simplify command factory logic
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Added/updated unit tests
- [ ] Tested manually in VS Code
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── commands/           # Command implementations
├── constants/          # Configuration and constants
├── deps/              # Dependency detection
├── engine/            # Core formatting logic  
├── presets/           # Button preset definitions
├── services/          # Core services
├── types/             # TypeScript type definitions
├── ui/                # User interface components
└── extension.ts       # Main entry point
```

### Key Concepts
- **Context Detection**: Analyzing cursor position for smart button visibility
- **Command Delegation**: Forwarding to external extensions when available
- **Preset System**: Predefined button configurations
- **Fallback Commands**: Internal implementations when extensions unavailable

## 🎯 Contribution Guidelines

### Small Contributions
- **Typo fixes**: Direct PR welcome
- **Small bug fixes**: Add issue + PR
- **Documentation**: Improvements always welcome

### Large Contributions
- **New features**: Open issue first to discuss
- **Architecture changes**: Discuss in issue before coding
- **Breaking changes**: Require maintainer approval

### Code Review Process
1. **Automated checks** must pass (tests, linting)
2. **Maintainer review** for code quality and design
3. **Testing verification** in multiple scenarios
4. **Documentation review** if applicable
5. **Merge** when approved

## 🌟 Recognition

Contributors will be:
- **Listed** in CONTRIBUTORS.md
- **Mentioned** in release notes
- **Credited** in extension marketplace description

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas  
- **Code Review**: Maintainers provide feedback on PRs
- **Documentation**: Check guides in `/docs` folder

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 📚 Lessons Learned & Continuous Learning

### 🔍 Recent Insights

- **Onboarding Experience**: New contributors struggle with extension development setup - improve documentation
- **Testing Barriers**: Integration testing complexity deters contributions - provide better test utilities
- **Code Review Process**: Inconsistent review criteria across maintainers - standardize checklists
- **Documentation Gaps**: API documentation lags behind code changes - implement automated docs

### 💡 Future Considerations

- **Contributor Templates**: Create standardized PR and issue templates for better workflow
- **Automated Testing**: Implement CI checks for common contribution mistakes
- **Mentorship Program**: Pair new contributors with experienced maintainers
- **Code Quality Tools**: Integrate automated code quality checks and formatting

### 📝 Development Notes

- **Contribution Workflow**: Document the complete contribution process with visuals
- **Testing Guidelines**: Provide clear testing standards for different contribution types
- **Review Criteria**: Maintain consistent code review standards across all PRs
- **Release Process**: Document how contributions make it into releases

---

## 📋 Document Review Status

- [ ] **Setup Instructions**: All installation and setup steps are accurate and complete
- [ ] **Code Examples**: All code snippets compile and work as expected
- [ ] **Links**: All internal and external links are functional
- [ ] **Process Clarity**: Contribution workflow is clear and easy to follow
- [ ] **Cross-Platform**: Instructions work across all supported platforms
- [ ] **Accessibility**: Content follows accessibility best practices

**Last Reviewed:** September 2, 2025  
**Review Version:** v2.0.0  
**Next Review Due:** December 2, 2025

---

**Thank you for making the Markdown Toolbar extension better! 🙌**