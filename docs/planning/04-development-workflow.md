# VS Code Extension Development Workflow and Tooling

## Overview

This article documents the complete development workflow, build system, and tooling setup for the markdown toolbar extension. It covers everything from initial setup through production deployment, providing a blueprint for modern VS Code extension development.

## Development Environment Setup

### Prerequisites

```json
{
  "engines": {
    "vscode": "^1.102.0",
    "node": ">=18.0.0"
  }
}
```

### Essential VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "connor4312.esbuild-problem-matchers", 
    "ms-vscode.extension-test-runner"
  ]
}
```

### TypeScript Configuration

#### Build Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src", 
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "lib": ["ES2020"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.spec.ts", "test/**/*"]
}
```

**Key decisions:**
- **ES2020 target**: Modern JavaScript features while maintaining compatibility
- **CommonJS modules**: Required for VS Code extensions
- **Strict mode**: Catch potential issues early
- **Source maps**: Essential for debugging
- **Declarations**: Support for IntelliSense and type checking

## Build System Architecture

### Concurrent Build Process

The extension uses a sophisticated build system that combines TypeScript compilation with esbuild bundling:

```json
{
  "scripts": {
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "compile": "npm run check-types && npm run lint && node esbuild.js",
    "package": "npm run check-types && npm run lint && node esbuild.js --production"
  }
}
```

### TypeScript Watch Mode

TypeScript runs in watch mode for type checking only:

```bash
tsc --noEmit --watch --project tsconfig.json
```

**Benefits:**
- **Fast type checking**: No compilation overhead  
- **Real-time feedback**: Errors appear immediately
- **Memory efficient**: No file output reduces I/O

### esbuild Bundle Configuration

#### Development Build (`esbuild.js`)

```javascript
const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

**Key features:**
- **Bundle optimization**: Single file output for faster loading
- **External VS Code API**: Prevents bundling VS Code modules
- **Problem matcher integration**: Errors show in VS Code Problems panel
- **Conditional source maps**: Development vs production builds

### Task Configuration

#### VS Code Tasks (`/.vscode/tasks.json`)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "watch",
      "dependsOn": ["npm: watch:tsc", "npm: watch:esbuild"],
      "presentation": { "reveal": "never" },
      "group": { "kind": "build", "isDefault": true }
    },
    {
      "type": "npm",
      "script": "watch:esbuild", 
      "group": "build",
      "problemMatcher": "$esbuild-watch",
      "isBackground": true,
      "presentation": { "group": "watch", "reveal": "never" }
    },
    {
      "type": "npm",
      "script": "watch:tsc",
      "group": "build", 
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "presentation": { "group": "watch", "reveal": "never" }
    }
  ]
}
```

**Benefits:**
- **Default build task**: `Ctrl+Shift+P` → "Tasks: Run Build Task"
- **Problem matchers**: Errors integrated with VS Code UI
- **Background tasks**: Non-blocking execution
- **Grouped presentation**: Clean terminal organization

## Development Workflow

### Daily Development Cycle

1. **Start watch mode**: `npm run watch` or `Ctrl+Shift+P` → "Tasks: Run Build Task"
2. **Launch extension host**: `F5` for debugging
3. **Make changes**: Auto-recompilation and reload
4. **Run tests**: `npm run test:unit` for quick feedback
5. **Debug**: Set breakpoints and inspect state

### Debugging Configuration

#### Extension Debugging (`/.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost", 
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    },
    {
      "name": "Debug Unit Tests",
      "type": "node",
      "request": "launch", 
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Hot Reload Development

The watch system enables rapid iteration:

1. **Code changes**: Automatic TypeScript type checking
2. **Bundle updates**: esbuild rebuilds extension bundle
3. **Extension reload**: `Ctrl+R` in extension development host
4. **Test feedback**: Fast unit test execution

## Quality Assurance Pipeline

### Linting Configuration

#### ESLint Setup (`eslint.config.mjs`)

```javascript
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
  files: ["**/*.ts"],
  plugins: { "@typescript-eslint": typescriptEslint },
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/naming-convention": ["warn", {
      selector: "import",
      format: ["camelCase", "PascalCase"],
    }],
    curly: "warn",
    eqeqeq: "warn", 
    "no-throw-literal": "warn",
    semi: "warn",
  },
}];
```

### Pre-commit Quality Checks

The `compile` script runs comprehensive checks:

```bash
npm run compile
# Equivalent to:
# npm run check-types  (TypeScript compilation)
# npm run lint         (ESLint)  
# node esbuild.js      (Bundle creation)
```

### Testing Integration

#### Test Commands

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest", 
    "test:integration": "node ./dist/test/runTest.js",
    "test:cov": "vitest run --coverage"
  }
}
```

#### Continuous Testing

```bash
# Watch mode for rapid feedback
npm run test:unit:watch

# Full test suite
npm test

# Coverage analysis
npm run test:cov
```

## Packaging and Distribution

### Production Build Process

```bash
npm run package
```

This command:
1. **Type checks** all TypeScript code
2. **Lints** for code quality issues  
3. **Bundles** with production optimizations
4. **Minifies** for smaller file size
5. **Excludes source maps** for security

### Extension Packaging

#### Package Configuration (`package.json`)

```json
{
  "main": "./dist/extension.js",
  "scripts": {
    "vscode:prepublish": "npm run package"
  },
  "files": [
    "dist/",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
}
```

#### VSIX Generation

```bash
# Install vsce globally
npm install -g vsce

# Package extension
vsce package

# Output: markdown-toolbar-0.1.0.vsix
```

### File Exclusion (`/.vscodeignore`)

```text
.vscode/**
.vscode-test/**
out/**
node_modules/**
src/**
.gitignore
esbuild.js
vsc-extension-quickstart.md
**/tsconfig.json
**/eslint.config.mjs
**/*.map
**/*.ts
```

**Strategy**: Include only essential runtime files in published extension.

## Continuous Integration

### GitHub Actions Workflow

#### Multi-platform Testing (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18

    - name: Install dependencies
      run: npm install

    - name: Run lint
      run: npm run lint

    - name: Run type check
      run: npm run check-types

    - name: Run unit tests
      run: npm run test:unit

    - name: Run coverage analysis
      run: npm run test:cov

  integration-test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Node.js  
      uses: actions/setup-node@v4
      with:
        node-version: 18

    - name: Install dependencies
      run: npm install

    - name: Run integration tests
      run: xvfb-run -a npm run test:integration

  package:
    runs-on: ubuntu-latest
    needs: [test, integration-test]
    
    steps:
    - name: Package extension
      run: npm run package

    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: markdown-toolbar-${{ github.sha }}
        path: dist/
```

### Quality Gates

The CI pipeline enforces quality standards:

1. **Linting**: Code style and potential issues
2. **Type checking**: TypeScript compilation without errors
3. **Unit tests**: Core logic validation
4. **Coverage thresholds**: Minimum code coverage requirements
5. **Integration tests**: VS Code API compatibility
6. **Multi-platform**: Ensure compatibility across operating systems

## Performance Monitoring

### Bundle Analysis

Monitor bundle size and dependencies:

```bash
# Analyze bundle composition  
npx esbuild src/extension.ts --bundle --analyze --external:vscode

# Check bundle size
ls -lh dist/extension.js
```

### Build Performance

Track build times for optimization:

```bash
# Time TypeScript compilation
time npx tsc --noEmit

# Time esbuild bundling  
time node esbuild.js
```

### Memory Usage

Monitor extension memory consumption:

```typescript
// Add to extension for profiling
console.log('Extension activated, memory usage:', process.memoryUsage());
```

## Development Tools and Utilities

### Useful VS Code Commands

```text
F5                          - Launch extension development host
Ctrl+Shift+P                - Command palette
Ctrl+Shift+`                - New terminal
Ctrl+Shift+B                - Run build task  
Ctrl+R (in extension host)  - Reload extension
```

### npm Scripts Reference

```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "npm run check-types && npm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch", 
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "npm run check-types && npm run lint && node esbuild.js --production",
    "check-types": "tsc --noEmit",
    "lint": "eslint src",
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "node ./dist/test/runTest.js",
    "test:cov": "vitest run --coverage"
  }
}
```

### Git Hooks (Optional)

#### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run lint
npm run check-types
npm run test:unit
```

## Troubleshooting Common Issues

### Build Problems

**TypeScript errors not showing**: Ensure `watch:tsc` task is running

**esbuild bundle errors**: Check external dependencies and import paths

**Extension not loading**: Verify `main` entry point in `package.json`

### Development Issues

**Breakpoints not working**: Ensure source maps are enabled in development

**Extension not reloading**: Use `Ctrl+R` in extension development host

**Tests failing**: Check mock configuration and VS Code API compatibility

### Performance Issues

**Slow builds**: Consider excluding test files from TypeScript compilation

**Large bundle size**: Analyze dependencies and consider code splitting

**Memory leaks**: Ensure proper disposal of VS Code event listeners

## Future Improvements

### Build System Enhancements

1. **Tree shaking optimization**: Further reduce bundle size
2. **Code splitting**: Lazy load non-critical features  
3. **Build caching**: Speed up incremental builds
4. **Bundle analysis**: Automated size monitoring

### Development Experience

1. **Live reload**: Automatic extension reload on changes
2. **Test coverage visualization**: Interactive coverage reports
3. **Performance profiling**: Automated performance regression detection
4. **Dependency updates**: Automated security and compatibility updates

### Quality Assurance

1. **Visual regression testing**: Screenshot comparison tests
2. **Accessibility testing**: Automated a11y validation
3. **Cross-platform testing**: Expanded OS and VS Code version matrix
4. **User acceptance testing**: Automated UI interaction tests

## Conclusion

The development workflow demonstrates how modern tooling can create an efficient and reliable extension development experience. Key principles:

1. **Fast feedback loops**: Watch modes and incremental builds
2. **Quality automation**: Linting, type checking, and testing integration
3. **Production readiness**: Optimized builds and packaging
4. **Developer experience**: Comprehensive tooling and debugging support

The resulting workflow enables confident development, easy collaboration, and reliable deployments while maintaining high code quality throughout the development lifecycle.
