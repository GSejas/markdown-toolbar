# 🤝 Contributing Guidelines

## Welcome Contributors

Thank you for your interest in contributing to the Markdown Extended Toolbar VS Code extension! This document provides guidelines and best practices for contributing to the project.

## 📋 Quick Start

### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/markdown-toolbar.git
   cd markdown-toolbar
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development**

   ```bash
   npm run watch
   ```

4. **Open in VS Code**
   - Press `F5` to launch extension development host
   - Test your changes in the new window

### Development Workflow

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

2. **Make changes**
   - Follow the coding standards
   - Write tests for new features
   - Update documentation

3. **Test your changes**

   ```bash
   npm run test
   npm run compile
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Types of Contributions

### Code Contributions

- **Bug fixes**: Fix issues reported in GitHub issues
- **Features**: Implement new functionality
- **Performance**: Optimize existing code
- **Security**: Address security vulnerabilities

### Non-Code Contributions

- **Documentation**: Improve docs, write tutorials
- **Testing**: Write tests, improve test coverage
- **Design**: UI/UX improvements, icon design
- **Translation**: Add language support
- **Support**: Help other users, triage issues

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Code Style

```typescript
// ✅ Good
export class MarkdownFormatter {
  constructor(private contextDetector: ContextDetector) {}

  formatBold(text: string): string {
    const context = this.contextDetector.detect(text);
    return this.applyBoldFormatting(text, context);
  }
}

// ❌ Avoid
export class fmt {
  constructor(c: any) {}
  b(t: string): string {
    return '**' + t + '**';
  }
}
```

### Commit Messages

Follow conventional commit format:

```bash
# Feature commits
feat: add table formatting support
feat: implement header code lens

# Bug fixes
fix: resolve crash on empty document
fix: correct regex pattern for links

# Documentation
docs: update installation guide
docs: add API reference

# Testing
test: add unit tests for formatter
test: improve integration test coverage

# Refactoring
refactor: simplify command factory
refactor: extract common utilities
```

## 🧪 Testing

### Test Requirements

- **Unit tests**: Required for all new features
- **Integration tests**: Required for command interactions
- **E2E tests**: Recommended for complex workflows

### Test Coverage

- Maintain >90% unit test coverage
- Include edge cases and error conditions
- Test both success and failure scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:cov

# Run integration tests
npm run test:integration
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments to public methods
- Document complex algorithms
- Explain non-obvious code decisions

```typescript
/**
 * Formats markdown text with bold styling
 * @param text - The text to format
 * @param context - Current cursor context
 * @returns Formatted text with bold markdown
 */
formatBold(text: string, context: CursorContext): string {
  // Implementation...
}
```

### User Documentation

- Update README for new features
- Add examples for complex functionality
- Keep API documentation current

## 🔍 Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Template

Please use the following template:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Tests pass
   - Code quality checks pass

2. **Code Review**
   - At least one maintainer reviews
   - Feedback addressed
   - Approval given

3. **Merge**
   - Squash merge preferred
   - Delete branch after merge

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- VS Code version: [e.g., 1.80.0]
- Extension version: [e.g., 1.2.3]
- OS: [e.g., Windows 10]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context about the feature request here.
```

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn
- Maintain professional communication

### Unacceptable Behavior

- Harassment or discrimination
- Offensive language or content
- Personal attacks
- Spam or off-topic content

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Technical questions and bug reports
- **GitHub Discussions**: General questions and ideas
- **Email**: Private matters or security issues

### Response Times

- **Issues**: Acknowledged within 48 hours
- **PR Reviews**: Initial review within 1 week
- **Support**: Best effort basis

## 🎉 Recognition

Contributors are recognized through:

- GitHub contributor statistics
- Changelog mentions
- Special contributor badges
- Project maintainer roles (for significant contributions)

## 📋 Additional Resources

- [VS Code Extension Development](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Markdown Specification](https://spec.commonmark.org/)
- [Conventional Commits](https://conventionalcommits.org/)
