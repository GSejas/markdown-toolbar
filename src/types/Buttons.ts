/**
 * @moduleName: Button Types - Type Definitions for Button System
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive type definitions for button system, presets, and toolbar configurations
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @requirementsTraceability:
 *   {@link Requirements.REQ_TYPES_001} (Button Type Definitions)
 *   {@link Requirements.REQ_TYPES_002} (Preset Type System)
 *   {@link Requirements.REQ_TYPES_003} (Configuration Types)
 * @briefDescription: Defines all TypeScript types and interfaces for the button system including button IDs, preset definitions, toolbar configurations, and validation schemas
 * @methods: Type definitions and interfaces only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - ButtonId: 'fmt.bold' | 'fmt.italic' | 'code.inline' | etc.
 *   - PresetId: 'core' | 'writer' | 'pro' | 'custom'
 *   - Toolbar configuration with dependency-aware button sets
 * @vulnerabilitiesAssessment: Type safety validation, compile-time error detection, no runtime security concerns
 */

/**
 * Type definitions for button system and presets
 */

export type PresetId = 'core' | 'writer' | 'pro' | 'custom'
  | 'test-minimal' | 'test-student' | 'test-blogger' | 'test-developer'
  | 'test-researcher' | 'test-presenter' | 'test-qa' | 'test-mobile'
  | 'test-power' | 'test-accessibility';

export type ButtonId =
  // Preview
  | 'preview.side' | 'preview.current' | 'preview.lock'

  // Format  
  | 'fmt.bold' | 'fmt.italic' | 'fmt.strike' | 'fmt.code' | 'fmt.highlight'

  // Headings
  | 'heading.h1' | 'heading.h2' | 'heading.h3' | 'heading.h4' | 'heading.h5' | 'heading.h6' | 'heading.toggle'

  // Structure
  | 'list.toggle' | 'task.toggle' | 'blockquote.toggle' | 'hr.insert'

  // Code
  | 'code.inline' | 'code.block'

  // Media
  | 'link.insert' | 'image.insert' | 'image.paste'

  // Extended Features
  | 'footnote.insert' | 'math.inline' | 'math.block' | 'break.line'

  // Mermaid (requires mermaid extensions)
  | 'mermaid.insert'

  // TOC (requires MAIO)
  | 'toc.create' | 'toc.update' | 'toc.addNumbers' | 'toc.removeNumbers'

  // Tables
  | 'table.menu'

  // Quality (requires markdownlint)
  | 'lint.fix' | 'lint.workspace'

  // Enhanced preview (requires MPE)
  | 'preview.mpe.side' | 'preview.mpe.current'

  // Debug utilities
  | 'debug.presetCycle';

export type ButtonCategory = 'preview' | 'format' | 'heading' | 'structure' | 'code' | 'media' | 'extended' | 'toc' | 'tables' | 'quality' | 'debug';

export interface IButtonDefinition {
  id: ButtonId;
  title: string;
  icon: string;
  category: ButtonCategory;
  commandId: string;
  delegatesTo?: string; // External command to delegate to
  fallbackCommand?: string; // Internal fallback command  
  requiresExtension?: string; // Extension ID requirement
  tooltip: string;
  when?: string; // VS Code when clause
}

export interface IPresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  buttons: ButtonId[];
  requiredExtensions?: string[];
}

export const BUTTON_DEFINITIONS: Record<ButtonId, IButtonDefinition> = {
  // Preview
  'preview.side': {
    id: 'preview.side',
    title: 'Preview (Side)',
    icon: '$(preview)',
    category: 'preview',
    commandId: 'mdToolbar.preview.side',
    delegatesTo: 'markdown.showPreviewToSide',
    tooltip: 'Open preview to the side'
  },
  'preview.current': {
    id: 'preview.current',
    title: 'Preview',
    icon: '$(preview)',
    category: 'preview',
    commandId: 'mdToolbar.preview.current',
    delegatesTo: 'markdown.showPreview',
    tooltip: 'Open preview in current editor group'
  },
  'preview.lock': {
    id: 'preview.lock',
    title: 'Lock Preview',
    icon: '$(lock)',
    category: 'preview',
    commandId: 'mdToolbar.preview.lock',
    fallbackCommand: 'mdToolbar.internal.previewLock',
    tooltip: 'Lock preview to current document'
  },

  // Format
  'fmt.bold': {
    id: 'fmt.bold',
    title: 'Bold',
    icon: '$(bold)',
    category: 'format',
    commandId: 'mdToolbar.fmt.bold',
    delegatesTo: 'markdown.extension.editing.toggleBold',
    fallbackCommand: 'mdToolbar.internal.bold',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle bold formatting'
  },
  'fmt.italic': {
    id: 'fmt.italic',
    title: 'Italic',
    icon: '$(italic)',
    category: 'format',
    commandId: 'mdToolbar.fmt.italic',
    delegatesTo: 'markdown.extension.editing.toggleItalic',
    fallbackCommand: 'mdToolbar.internal.italic',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle italic formatting'
  },
  'fmt.strike': {
    id: 'fmt.strike',
    title: 'Strikethrough',
    icon: '$(text-size)',
    category: 'format',
    commandId: 'mdToolbar.fmt.strike',
    delegatesTo: 'markdown.extension.editing.toggleStrikethrough',
    fallbackCommand: 'mdToolbar.internal.strikethrough',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle strikethrough formatting'
  },
  'fmt.code': {
    id: 'fmt.code',
    title: 'Code',
    icon: '$(code)',
    category: 'format',
    commandId: 'mdToolbar.fmt.code',
    fallbackCommand: 'mdToolbar.internal.code',
    tooltip: 'Toggle inline code formatting'
  },
  'fmt.highlight': {
    id: 'fmt.highlight',
    title: 'Highlight',
    icon: '$(symbol-color)',
    category: 'format',
    commandId: 'mdToolbar.fmt.highlight',
    fallbackCommand: 'mdToolbar.internal.highlight',
    tooltip: 'Toggle highlight formatting (==text==)'
  },

  // Headings
  'heading.h1': {
    id: 'heading.h1',
    title: 'Heading 1',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h1',
    fallbackCommand: 'mdToolbar.internal.heading1',
    tooltip: 'Insert or toggle H1 heading'
  },
  'heading.h2': {
    id: 'heading.h2',
    title: 'Heading 2',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h2',
    fallbackCommand: 'mdToolbar.internal.heading2',
    tooltip: 'Insert or toggle H2 heading'
  },
  'heading.h3': {
    id: 'heading.h3',
    title: 'Heading 3',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h3',
    fallbackCommand: 'mdToolbar.internal.heading3',
    tooltip: 'Insert or toggle H3 heading'
  },
  'heading.h4': {
    id: 'heading.h4',
    title: 'Heading 4',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h4',
    fallbackCommand: 'mdToolbar.internal.heading4',
    tooltip: 'Insert or toggle H4 heading'
  },
  'heading.h5': {
    id: 'heading.h5',
    title: 'Heading 5',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h5',
    fallbackCommand: 'mdToolbar.internal.heading5',
    tooltip: 'Insert or toggle H5 heading'
  },
  'heading.h6': {
    id: 'heading.h6',
    title: 'Heading 6',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.h6',
    fallbackCommand: 'mdToolbar.internal.heading6',
    tooltip: 'Insert or toggle H6 heading'
  },
  'heading.toggle': {
    id: 'heading.toggle',
    title: 'Cycle Heading',
    icon: '$(symbol-text)',
    category: 'heading',
    commandId: 'mdToolbar.heading.toggle',
    fallbackCommand: 'mdToolbar.internal.headingToggle',
    tooltip: 'Cycle through heading levels (H1-H6, none)'
  },

  // Structure
  'list.toggle': {
    id: 'list.toggle',
    title: 'Toggle List',
    icon: '$(list-unordered)',
    category: 'structure',
    commandId: 'mdToolbar.list.toggle',
    delegatesTo: 'markdown.extension.editing.toggleList',
    fallbackCommand: 'mdToolbar.internal.list',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle bullet/numbered list'
  },
  'task.toggle': {
    id: 'task.toggle',
    title: 'Toggle Task',
    icon: '$(checklist)',
    category: 'structure',
    commandId: 'mdToolbar.task.toggle',
    fallbackCommand: 'mdToolbar.internal.task',
    tooltip: 'Toggle task list item',
    when: 'mdToolbar.onTaskLine'
  },
  'blockquote.toggle': {
    id: 'blockquote.toggle',
    title: 'Blockquote',
    icon: '$(quote)',
    category: 'structure',
    commandId: 'mdToolbar.blockquote.toggle',
    fallbackCommand: 'mdToolbar.internal.blockquote',
    tooltip: 'Toggle blockquote formatting'
  },
  'hr.insert': {
    id: 'hr.insert',
    title: 'Horizontal Rule',
    icon: '$(md-horizontal-rule)',
    category: 'structure',
    commandId: 'mdToolbar.hr.insert',
    fallbackCommand: 'mdToolbar.internal.horizontalRule',
    tooltip: 'Insert horizontal rule (---)'
  },

  // Code
  'code.inline': {
    id: 'code.inline',
    title: 'Inline Code',
    icon: '`',
    category: 'code',
    commandId: 'mdToolbar.code.inline',
    delegatesTo: 'markdown.extension.editing.toggleCodeSpan',
    fallbackCommand: 'mdToolbar.internal.code',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle inline code formatting'
  },
  'code.block': {
    id: 'code.block',
    title: 'Code Block',
    icon: '$(terminal)',
    category: 'code',
    commandId: 'mdToolbar.code.block',
    delegatesTo: 'markdown.extension.editing.toggleCodeBlock',
    fallbackCommand: 'mdToolbar.internal.codeBlock',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Toggle code block formatting'
  },

  // Media
  'link.insert': {
    id: 'link.insert',
    title: 'Insert Link',
    icon: '$(link)',
    category: 'media',
    commandId: 'mdToolbar.link.insert',
    fallbackCommand: 'mdToolbar.internal.link',
    tooltip: 'Insert or edit link'
  },
  'image.insert': {
    id: 'image.insert',
    title: 'Insert Image',
    icon: '$(md-image-plus)',
    category: 'media',
    commandId: 'mdToolbar.image.insert',
    fallbackCommand: 'mdToolbar.internal.image',
    tooltip: 'Insert image from file'
  },
  'image.paste': {
    id: 'image.paste',
    title: 'Paste Image',
    icon: '$(file-media)',
    category: 'media',
    commandId: 'mdToolbar.image.paste',
    delegatesTo: 'extension.pasteImage',
    requiresExtension: 'mushan.vscode-paste-image',
    tooltip: 'Paste image from clipboard',
    when: 'mdToolbar.hasPasteImage'
  },

  // Extended Features
  'footnote.insert': {
    id: 'footnote.insert',
    title: 'Footnote',
    icon: '$(note)',
    category: 'extended',
    commandId: 'mdToolbar.footnote.insert',
    fallbackCommand: 'mdToolbar.internal.footnote',
    tooltip: 'Insert footnote reference and definition'
  },
  'math.inline': {
    id: 'math.inline',
    title: 'Inline Math',
    icon: '$(md-math-inline)',
    category: 'extended',
    commandId: 'mdToolbar.math.inline',
    fallbackCommand: 'mdToolbar.internal.mathInline',
    tooltip: 'Insert inline math expression ($...$)'
  },
  'math.block': {
    id: 'math.block',
    title: 'Math Block',
    icon: '$(symbol-math)',
    category: 'extended',
    commandId: 'mdToolbar.math.block',
    fallbackCommand: 'mdToolbar.internal.mathBlock',
    tooltip: 'Insert math block ($$...$$)'
  },
  'break.line': {
    id: 'break.line',
    title: 'Line Break',
    icon: '$(arrow-down)',
    category: 'extended',
    commandId: 'mdToolbar.break.line',
    fallbackCommand: 'mdToolbar.internal.lineBreak',
    tooltip: 'Insert hard line break (double space + enter)'
  },

  // Mermaid
  'mermaid.insert': {
    id: 'mermaid.insert',
    title: 'Mermaid Diagram',
    icon: '$(graph)',
    category: 'extended',
    commandId: 'mdToolbar.mermaid.insert',
    fallbackCommand: 'mdToolbar.internal.mermaidInsert',
    tooltip: 'Insert mermaid diagram block'
  },

  // TOC
  'toc.create': {
    id: 'toc.create',
    title: 'Create TOC',
    icon: '$(list-ordered)',
    category: 'toc',
    commandId: 'mdToolbar.toc.create',
    delegatesTo: 'markdown.extension.toc.create',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Create table of contents',
    when: 'mdToolbar.hasMAIO'
  },
  'toc.update': {
    id: 'toc.update',
    title: 'Update TOC',
    icon: '$(list-ordered)',
    category: 'toc',
    commandId: 'mdToolbar.toc.update',
    delegatesTo: 'markdown.extension.toc.update',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Update existing table of contents',
    when: 'mdToolbar.hasMAIO'
  },
  'toc.addNumbers': {
    id: 'toc.addNumbers',
    title: 'Add TOC Numbers',
    icon: '$(list-ordered)',
    category: 'toc',
    commandId: 'mdToolbar.toc.addNumbers',
    delegatesTo: 'markdown.extension.toc.addSecNumbers',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Add section numbers to TOC',
    when: 'mdToolbar.hasMAIO'
  },
  'toc.removeNumbers': {
    id: 'toc.removeNumbers',
    title: 'Remove TOC Numbers',
    icon: '$(list-ordered)',
    category: 'toc',
    commandId: 'mdToolbar.toc.removeNumbers',
    delegatesTo: 'markdown.extension.toc.removeSecNumbers',
    requiresExtension: 'yzhang.markdown-all-in-one',
    tooltip: 'Remove section numbers from TOC',
    when: 'mdToolbar.hasMAIO'
  },

  // Tables
  'table.menu': {
    id: 'table.menu',
    title: 'Table Menu',
    icon: '$(table)',
    category: 'tables',
    commandId: 'mdToolbar.table.menu',
    fallbackCommand: 'mdToolbar.internal.tableMenu',
    tooltip: 'Table formatting options',
    when: 'mdToolbar.inTable'
  },

  // Quality 
  'lint.fix': {
    id: 'lint.fix',
    title: 'Fix All Issues',
    icon: '$(wrench)',
    category: 'quality',
    commandId: 'mdToolbar.lint.fix',
    delegatesTo: 'markdownlint.fixAll',
    requiresExtension: 'DavidAnson.vscode-markdownlint',
    tooltip: 'Fix all markdownlint issues in document',
    when: 'mdToolbar.hasMarkdownlint'
  },
  'lint.workspace': {
    id: 'lint.workspace',
    title: 'Lint Workspace',
    icon: '$(wrench)',
    category: 'quality',
    commandId: 'mdToolbar.lint.workspace',
    delegatesTo: 'markdownlint.lintWorkspace',
    requiresExtension: 'DavidAnson.vscode-markdownlint',
    tooltip: 'Lint all markdown files in workspace',
    when: 'mdToolbar.hasMarkdownlint'
  },

  // Enhanced Preview
  'preview.mpe.side': {
    id: 'preview.mpe.side',
    title: 'Enhanced Preview (Side)',
    icon: '$(preview)',
    category: 'preview',
    commandId: 'mdToolbar.preview.mpe.side',
    delegatesTo: 'markdown-preview-enhanced.openPreviewToTheSide',
    requiresExtension: 'shd101wyy.markdown-preview-enhanced',
    tooltip: 'Open enhanced preview to the side',
    when: 'mdToolbar.hasMPE'
  },
  'preview.mpe.current': {
    id: 'preview.mpe.current',
    title: 'Enhanced Preview',
    icon: '$(preview)',
    category: 'preview',
    commandId: 'mdToolbar.preview.mpe.current',
    delegatesTo: 'markdown-preview-enhanced.openPreview',
    requiresExtension: 'shd101wyy.markdown-preview-enhanced',
    tooltip: 'Open enhanced preview in current group',
    when: 'mdToolbar.hasMPE'
  },

  // Debug utilities (only shown in debug mode)
  'debug.presetCycle': {
    id: 'debug.presetCycle',
    title: '🔄',
    icon: '$(refresh)',
    category: 'debug',
    commandId: 'mdToolbar.debug.cyclePreset',
    tooltip: 'Cycle through test presets (debug mode only)',
    when: 'mdToolbar.debugMode'
  }
};

export const PRESET_DEFINITIONS: Record<PresetId, IPresetDefinition> = {
  core: {
    id: 'core',
    name: 'Core',
    description: 'Essential formatting tools for quick notes',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'heading.toggle',
      'list.toggle',
      'code.inline',
      'link.insert',
      'image.insert',
      'debug.presetCycle'  // Add debug button to core preset
    ]
  },
  writer: {
    id: 'writer',
    name: 'Writer',
    description: 'Tools for documentation and long-form writing',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.strike',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'blockquote.toggle',
      'list.toggle',
      'task.toggle',
      'code.inline',
      'code.block',
      'link.insert',
      'image.insert',
      'hr.insert',
      'break.line',
      'toc.create',
      'toc.update',
      'table.menu'
    ],
    requiredExtensions: ['yzhang.markdown-all-in-one']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Complete toolkit with quality checks and advanced features',
    buttons: [
      'preview.side',
      'preview.mpe.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.strike',
      'heading.toggle',
      'blockquote.toggle',
      'list.toggle',
      'task.toggle',
      'code.inline',
      'code.block',
      'link.insert',
      'image.insert',
      'image.paste',
      'footnote.insert',
      'math.inline',
      'hr.insert',
      'toc.create',
      'toc.update',
      'toc.addNumbers',
      'toc.removeNumbers',
      'table.menu',
      'lint.fix',
      'lint.workspace'
    ],
    requiredExtensions: [
      'yzhang.markdown-all-in-one',
      'DavidAnson.vscode-markdownlint',
      'shd101wyy.markdown-preview-enhanced'
    ]
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined button selection',
    buttons: [] // Populated from settings
  },

  // Test presets for different user scenarios and journeys
  'test-minimal': {
    id: 'test-minimal',
    name: 'Test: Minimal',
    description: 'Absolute minimal set for basic markdown editing',
    buttons: [
      'fmt.bold',
      'fmt.italic',
      'heading.toggle',
      'preview.side'
    ]
  },
  'test-student': {
    id: 'test-student',
    name: 'Test: Student Notes',
    description: 'Optimized for note-taking and studying',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.highlight',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'list.toggle',
      'task.toggle',
      'code.inline',
      'link.insert',
      'math.inline',
      'toc.create'
    ]
  },
  'test-blogger': {
    id: 'test-blogger',
    name: 'Test: Blog Writer',
    description: 'Perfect for blog posts and articles',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.strike',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'blockquote.toggle',
      'list.toggle',
      'code.inline',
      'link.insert',
      'image.insert',
      'image.paste',
      'hr.insert',
      'toc.create'
    ]
  },
  'test-developer': {
    id: 'test-developer',
    name: 'Test: Developer Docs',
    description: 'Technical documentation with code focus',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.code',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'heading.h4',
      'code.inline',
      'code.block',
      'link.insert',
      'table.menu',
      'mermaid.insert',
      'toc.create',
      'toc.update'
    ]
  },
  'test-researcher': {
    id: 'test-researcher',
    name: 'Test: Academic Research',
    description: 'Academic writing with citations and footnotes',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'heading.h4',
      'blockquote.toggle',
      'list.toggle',
      'footnote.insert',
      'link.insert',
      'table.menu',
      'math.inline',
      'math.block',
      'toc.create',
      'toc.addNumbers'
    ]
  },
  'test-presenter': {
    id: 'test-presenter',
    name: 'Test: Presentation',
    description: 'Creating slides and presentation content',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.highlight',
      'heading.h1',
      'heading.h2',
      'list.toggle',
      'image.insert',
      'image.paste',
      'mermaid.insert',
      'table.menu',
      'hr.insert'
    ]
  },
  'test-qa': {
    id: 'test-qa',
    name: 'Test: Q&A Format',
    description: 'FAQ and question-answer documentation',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'heading.h2',
      'heading.h3',
      'blockquote.toggle',
      'list.toggle',
      'task.toggle',
      'code.inline',
      'link.insert',
      'toc.create'
    ]
  },
  'test-mobile': {
    id: 'test-mobile',
    name: 'Test: Mobile Friendly',
    description: 'Compact set for mobile/tablet editing',
    buttons: [
      'fmt.bold',
      'fmt.italic',
      'heading.toggle',
      'list.toggle',
      'code.inline',
      'link.insert'
    ]
  },
  'test-power': {
    id: 'test-power',
    name: 'Test: Power User',
    description: 'Everything enabled for advanced users',
    buttons: [
      'preview.side',
      'preview.lock',
      'fmt.bold',
      'fmt.italic',
      'fmt.strike',
      'fmt.code',
      'fmt.highlight',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'heading.h4',
      'heading.h5',
      'heading.h6',
      'heading.toggle',
      'blockquote.toggle',
      'list.toggle',
      'task.toggle',
      'code.inline',
      'code.block',
      'link.insert',
      'image.insert',
      'image.paste',
      'table.menu',
      'mermaid.insert',
      'footnote.insert',
      'math.inline',
      'math.block',
      'hr.insert',
      'toc.create',
      'toc.update',
      'toc.addNumbers',
      'lint.fix'
    ]
  },
  'test-accessibility': {
    id: 'test-accessibility',
    name: 'Test: Accessibility Focus',
    description: 'Emphasizes accessible content creation',
    buttons: [
      'preview.side',
      'fmt.bold',
      'fmt.italic',
      'heading.h1',
      'heading.h2',
      'heading.h3',
      'list.toggle',
      'link.insert',
      'image.insert',
      'table.menu',
      'toc.create',
      'lint.fix'
    ]
  }
};