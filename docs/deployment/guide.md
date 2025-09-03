# 🚀 Deployment & Release Management

## Executive Summary

This document outlines the deployment and release management processes for the Markdown Extended Toolbar VS Code extension. It covers build automation, packaging, distribution, versioning, and operational procedures to ensure reliable and efficient software delivery.

## 🏗️ Build System Architecture

### Build Pipeline Overview

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │ -> │   Build     │ -> │   Test      │ -> │   Package   │
│   Code      │    │   & Lint    │    │   & QA      │    │   & Sign    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                │                │                │
       v                v                v                v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  GitHub     │    │  Quality    │    │  Test       │    │  Artifact   │
│  Actions    │    │  Gates      │    │  Results    │    │  Registry   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Build Tools Configuration

#### package.json Build Scripts

```json
{
  "scripts": {
    "build": "npm run clean && npm run compile && npm run bundle",
    "clean": "rimraf dist/",
    "compile": "tsc --noEmit",
    "bundle": "esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node --target=node18",
    "watch": "npm run bundle -- --watch",
    "lint": "eslint src --ext ts",
    "lint:fix": "eslint src --ext ts --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "package": "vsce package --no-dependencies",
    "publish": "vsce publish --no-dependencies",
    "prepublishOnly": "npm run build && npm run test && npm run lint"
  }
}
```

#### esbuild Configuration

```javascript
// esbuild.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: false,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  loader: {
    '.ts': 'ts',
    '.js': 'js'
  },
  plugins: [
    // Custom plugins for optimization
  ]
}).catch(() => process.exit(1));
```

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "dist",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## 🔄 Continuous Integration Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run type checking
      run: npm run compile

    - name: Run tests
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

    - name: Build extension
      run: npm run build

    - name: Package extension
      run: npm run package
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18'

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: extension-package-${{ matrix.os }}-${{ matrix.node-version }}
        path: "*.vsix"
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18'
```

### Quality Gates

```yaml
# Quality gate job
quality-gate:
  needs: test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'

  steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Download coverage reports
    uses: actions/download-artifact@v3
    with:
      name: coverage-reports

  - name: Quality gate check
    run: |
      # Check coverage threshold
      if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 90 ]; then
        echo "Coverage below 90%"
        exit 1
      fi

      # Check for linting errors
      if [ -f eslint-report.json ]; then
        echo "Linting errors found"
        exit 1
      fi

      # Check bundle size
      if [ $(stat -f%z dist/extension.js) -gt 1048576 ]; then
        echo "Bundle size exceeds 1MB"
        exit 1
      fi
```

## 📦 Packaging & Distribution

### VS Code Extension Packaging

```bash
# Manual packaging
npm run build
vsce package --no-dependencies

# Package with dependencies
vsce package

# Package for pre-release
vsce package --pre-release

# Package with specific version
vsce package 1.2.3
```

### Package Structure

```text
extension.vsix
├── extension/
│   ├── package.json
│   ├── dist/
│   │   ├── extension.js
│   │   └── extension.js.map
│   ├── assets/
│   │   └── icons/
│   └── README.md
├── [Content_Types].xml
└── _rels/
```

### Distribution Channels

#### Visual Studio Code Marketplace

```bash
# Publish to marketplace
vsce publish

# Publish pre-release
vsce publish --pre-release

# Publish with specific version
vsce publish 1.2.3

# Publish to specific marketplace
vsce publish --packagePath extension.vsix
```

#### Open VSX Registry

```bash
# Install Open VSX CLI
npm install -g ovsx

# Publish to Open VSX
ovsx publish extension.vsix

# Publish with PAT
ovsx publish -p $OPEN_VSX_TOKEN extension.vsix
```

## 🏷️ Version Management

### Semantic Versioning Strategy

```text
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └─ Bug fixes, patches
  │      └─ New features, minor changes
  └─ Breaking changes, major updates
```

### Version Automation

```javascript
// version-bump.js
const fs = require('fs');
const path = require('path');

function bumpVersion(type) {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const [major, minor, patch] = packageJson.version.split('.').map(Number);

  switch (type) {
    case 'major':
      packageJson.version = `${major + 1}.0.0`;
      break;
    case 'minor':
      packageJson.version = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      packageJson.version = `${major}.${minor}.${patch + 1}`;
      break;
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  return packageJson.version;
}

// Usage
const newVersion = bumpVersion(process.argv[2]);
console.log(`Version bumped to ${newVersion}`);
```

### Release Branching Strategy

```text
main (production)
├── develop (integration)
│   ├── feature/header-commands
│   ├── feature/table-editor
│   └── bugfix/crash-on-empty-doc
└── hotfix/security-patch
```

### Changelog Management

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New header formatting commands
- Table editing capabilities

### Changed
- Improved performance for large documents

### Fixed
- Crash when opening empty markdown files

## [1.2.0] - 2025-09-02

### Added
- CodeLens support for headers and tables
- Status bar integration
```

## 🔐 Security & Code Signing

### Code Signing Setup

```bash
# Generate signing key
openssl genrsa -out private-key.pem 2048
openssl rsa -in private-key.pem -pubout -out public-key.pem

# Sign package
vsce sign --packagePath extension.vsix --keyFile private-key.pem

# Verify signature
vsce verify extension.vsix
```

### Security Scanning

```yaml
# Security scan job
security-scan:
  runs-on: ubuntu-latest
  steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Run security audit
    run: npm audit --audit-level high

  - name: Scan for secrets
    uses: gitleaks/gitleaks-action@v2

  - name: Dependency vulnerability scan
    uses: snyk/actions/node@master
    with:
      args: --file=package.json

  - name: CodeQL analysis
    uses: github/codeql-action/init@v2
    with:
      languages: javascript
```

## 🌍 Multi-Platform Deployment

### Platform-Specific Builds

```yaml
# Multi-platform build matrix
strategy:
  matrix:
    include:
    - os: ubuntu-latest
      target: linux-x64
      node: 18
    - os: windows-latest
      target: win32-x64
      node: 18
    - os: macos-latest
      target: darwin-x64
      node: 18
    - os: macos-latest
      target: darwin-arm64
      node: 18
```

### Platform-Specific Optimizations

```javascript
// platform-specific-build.js
const platform = process.platform;
const arch = process.arch;

const platformConfig = {
  win32: {
    icon: 'assets/icons/win-icon.ico',
    executable: 'extension.exe'
  },
  darwin: {
    icon: 'assets/icons/mac-icon.icns',
    executable: 'extension'
  },
  linux: {
    icon: 'assets/icons/linux-icon.png',
    executable: 'extension'
  }
};

module.exports = platformConfig[platform] || {};
```

## 📊 Release Analytics & Monitoring

### Release Metrics

```javascript
// release-metrics.js
const { Octokit } = require('@octokit/rest');

async function getReleaseMetrics(owner, repo, tag) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Get release info
  const release = await octokit.repos.getReleaseByTag({
    owner,
    repo,
    tag
  });

  // Get download count
  const downloads = release.data.assets.reduce((sum, asset) => {
    return sum + asset.download_count;
  }, 0);

  // Get installation metrics (if available)
  const installations = await getInstallationCount();

  return {
    downloads,
    installations,
    releaseDate: release.data.published_at,
    size: release.data.assets[0]?.size
  };
}
```

### Post-Release Monitoring

```yaml
# Post-release monitoring
post-release-monitoring:
  runs-on: ubuntu-latest
  if: github.event_name == 'release'

  steps:
  - name: Monitor error rates
    run: |
      # Check for increased error rates
      # Monitor performance metrics
      # Alert on critical issues

  - name: Update release status
    run: |
      # Update release status in tracking system
      # Send notifications to stakeholders
```

## 🚨 Rollback Procedures

### Automated Rollback

```bash
# Rollback to previous version
vsce publish --packagePath previous-version.vsix

# Update marketplace listing
vsce unpublish extension-id@current-version
```

### Manual Rollback Steps

1. **Stop the deployment pipeline**
2. **Identify the last stable version**
3. **Publish the previous version**
4. **Update marketplace listings**
5. **Notify users of the rollback**
6. **Monitor for issues**
7. **Plan fix for the problematic version**

### Rollback Validation

```yaml
# Rollback validation job
rollback-validation:
  runs-on: ubuntu-latest
  if: github.event_name == 'workflow_dispatch'

  steps:
  - name: Validate rollback package
    run: |
      # Verify package integrity
      # Run basic functionality tests
      # Check version compatibility

  - name: Confirm rollback
    run: |
      # Manual approval step
      # Notify team of rollback
```

## 🔄 Update Management

### Automatic Updates

```json
// package.json
{
  "engines": {
    "vscode": "^1.74.0"
  },
  "contributes": {
    "commands": [
      {
        "command": "markdownToolbar.checkForUpdates",
        "title": "Check for Updates"
      }
    ]
  }
}
```

### Update Notification System

```typescript
// Update notification service
export class UpdateService {
  async checkForUpdates(): Promise<UpdateInfo | null> {
    const currentVersion = vscode.extensions.getExtension('publisher.extension')?.packageJSON.version;
    const latestVersion = await this.fetchLatestVersion();

    if (this.isNewerVersion(latestVersion, currentVersion)) {
      return {
        version: latestVersion,
        changelog: await this.fetchChangelog(latestVersion),
        downloadUrl: this.getDownloadUrl(latestVersion)
      };
    }

    return null;
  }

  private isNewerVersion(latest: string, current: string): boolean {
    return semver.gt(latest, current);
  }
}
```

## 📋 Deployment Checklist

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code coverage >90%
- [ ] No linting errors
- [ ] Security scan passed
- [ ] Bundle size within limits
- [ ] Dependencies updated
- [ ] Changelog updated
- [ ] Version bumped correctly

### Deployment Checklist

- [ ] Build successful
- [ ] Package created
- [ ] Package signed
- [ ] Marketplace access confirmed
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Communication plan ready

### Post-Deployment Checklist

- [ ] Extension published successfully
- [ ] Marketplace listing updated
- [ ] Users notified of new version
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] Feedback collection enabled

---

**Document Version**: 2.0.0
**Last Updated**: September 2, 2025
**Build System**: esbuild + TypeScript
**CI/CD**: GitHub Actions
**Distribution**: VS Code Marketplace + Open VSX
**Author**: DevOps Team
**Classification**: Internal Use Only
