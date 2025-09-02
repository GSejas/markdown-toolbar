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

export type PresetId = 'core' | 'writer' | 'pro' | 'custom';

export type ButtonId =
  // Preview
  | 'preview.side' | 'preview.current'
  
  // Format  
  | 'fmt.bold' | 'fmt.italic' | 'fmt.strike'
  
  // Structure
  | 'list.toggle' | 'task.toggle'
  
  // Code
  | 'code.inline' | 'code.block'
  
  // Media
  | 'link.insert' | 'image.insert' | 'image.paste'
  
  // TOC (requires MAIO)
  | 'toc.create' | 'toc.update' | 'toc.addNumbers' | 'toc.removeNumbers'
  
  // Tables
  | 'table.menu'
  
  // Quality (requires markdownlint)
  | 'lint.fix' | 'lint.workspace'
  
  // Enhanced preview (requires MPE)
  | 'preview.mpe.side' | 'preview.mpe.current';

export type ButtonCategory = 'preview' | 'format' | 'structure' | 'code' | 'media' | 'toc' | 'tables' | 'quality';

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
    icon: '$(image)', 
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
      'list.toggle',
      'code.inline',
      'link.insert',
      'image.insert'
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
      'list.toggle',
      'task.toggle',
      'code.inline',
      'code.block', 
      'link.insert',
      'image.insert',
      'image.paste',
      'toc.create',
      'toc.update',
      'table.menu'
    ],
    requiredExtensions: ['yzhang.markdown-all-in-one']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full toolkit for maintainers and technical writers',
    buttons: [
      'preview.side',
      'preview.mpe.side',
      'fmt.bold',
      'fmt.italic',
      'fmt.strike', 
      'list.toggle',
      'task.toggle',
      'code.inline',
      'code.block',
      'link.insert',
      'image.insert',
      'image.paste',
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
  }
};