/**
 * @moduleName: Markdown Options - Complete Markdown Feature Set
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Comprehensive catalog of all markdown formatting options and features
 * @techStack: TypeScript
 * @dependency: None
 * @interModuleDependency: None
 * @briefDescription: Complete reference of markdown features, from basic formatting to advanced extensions like tables, math, diagrams, and GFM features
 * @methods: Constants and type definitions only
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Basic formatting: Bold, italic, strikethrough, code
 *   - Structure: Headers, lists, tables, blockquotes
 *   - Advanced: Math, diagrams, footnotes, task lists
 * @vulnerabilitiesAssessment: Read-only constants, no security concerns
 */

/**
 * COMPLETE MARKDOWN FEATURE SET
 * This ensures our toolbar can handle the full spectrum of markdown
 */

export interface IMarkdownFeature {
  id: string;
  name: string;
  category: string;
  description: string;
  syntax: string;
  example: string;
  supported: 'core' | 'gfm' | 'extension'; // What supports this feature
  complexity: 'basic' | 'intermediate' | 'advanced';
}

/**
 * COMPREHENSIVE MARKDOWN FEATURES CATALOG
 * This is the FULL set of markdown options available
 */
export const MARKDOWN_FEATURES: Record<string, IMarkdownFeature> = {
  // === BASIC TEXT FORMATTING ===
  'bold': {
    id: 'bold',
    name: 'Bold',
    category: 'Text Formatting',
    description: 'Make text bold/strong',
    syntax: '**text** or __text__',
    example: '**This is bold text**',
    supported: 'core',
    complexity: 'basic'
  },
  
  'italic': {
    id: 'italic', 
    name: 'Italic',
    category: 'Text Formatting',
    description: 'Make text italic/emphasized',
    syntax: '*text* or _text_',
    example: '*This is italic text*',
    supported: 'core',
    complexity: 'basic'
  },

  'strikethrough': {
    id: 'strikethrough',
    name: 'Strikethrough',
    category: 'Text Formatting', 
    description: 'Cross out text',
    syntax: '~~text~~',
    example: '~~This is struck through~~',
    supported: 'gfm',
    complexity: 'basic'
  },

  'underline': {
    id: 'underline',
    name: 'Underline',
    category: 'Text Formatting',
    description: 'Underline text (HTML)',
    syntax: '<u>text</u>',
    example: '<u>This is underlined</u>',
    supported: 'extension',
    complexity: 'intermediate'
  },

  'superscript': {
    id: 'superscript',
    name: 'Superscript',
    category: 'Text Formatting',
    description: 'Superscript text',
    syntax: '<sup>text</sup>',
    example: 'E = mc<sup>2</sup>',
    supported: 'extension',
    complexity: 'intermediate'
  },

  'subscript': {
    id: 'subscript',
    name: 'Subscript', 
    category: 'Text Formatting',
    description: 'Subscript text',
    syntax: '<sub>text</sub>',
    example: 'H<sub>2</sub>O',
    supported: 'extension',
    complexity: 'intermediate'
  },

  'highlight': {
    id: 'highlight',
    name: 'Highlight',
    category: 'Text Formatting',
    description: 'Highlight text',
    syntax: '==text==',
    example: '==This is highlighted==',
    supported: 'extension',
    complexity: 'intermediate'
  },

  // === HEADERS ===
  'header1': {
    id: 'header1',
    name: 'Header 1',
    category: 'Structure',
    description: 'Top-level heading',
    syntax: '# Header',
    example: '# Chapter Title',
    supported: 'core',
    complexity: 'basic'
  },

  'header2': {
    id: 'header2',
    name: 'Header 2',
    category: 'Structure',
    description: 'Second-level heading',
    syntax: '## Header',
    example: '## Section Title',
    supported: 'core',
    complexity: 'basic'
  },

  'header3': {
    id: 'header3',
    name: 'Header 3',
    category: 'Structure',
    description: 'Third-level heading',
    syntax: '### Header',
    example: '### Subsection Title',
    supported: 'core',
    complexity: 'basic'
  },

  // === CODE ===
  'inline_code': {
    id: 'inline_code',
    name: 'Inline Code',
    category: 'Code',
    description: 'Inline code formatting',
    syntax: '`code`',
    example: 'Use `console.log()` to debug',
    supported: 'core',
    complexity: 'basic'
  },

  'code_block': {
    id: 'code_block',
    name: 'Code Block',
    category: 'Code',
    description: 'Multi-line code block',
    syntax: '```language\\ncode\\n```',
    example: '```javascript\\nconsole.log("Hello");\\n```',
    supported: 'core',
    complexity: 'basic'
  },

  'code_block_indented': {
    id: 'code_block_indented',
    name: 'Indented Code Block',
    category: 'Code',
    description: 'Code block with 4-space indentation',
    syntax: '    code',
    example: '    console.log("Hello");',
    supported: 'core',
    complexity: 'intermediate'
  },

  // === LISTS ===
  'bullet_list': {
    id: 'bullet_list',
    name: 'Bullet List',
    category: 'Lists',
    description: 'Unordered list with bullets',
    syntax: '- item\\n- item',
    example: '- First item\\n- Second item',
    supported: 'core',
    complexity: 'basic'
  },

  'numbered_list': {
    id: 'numbered_list',
    name: 'Numbered List',
    category: 'Lists',
    description: 'Ordered list with numbers',
    syntax: '1. item\\n2. item',
    example: '1. First item\\n2. Second item',
    supported: 'core',
    complexity: 'basic'
  },

  'task_list': {
    id: 'task_list',
    name: 'Task List',
    category: 'Lists',
    description: 'Checkbox task list',
    syntax: '- [ ] task\\n- [x] done',
    example: '- [ ] Todo item\\n- [x] Completed item',
    supported: 'gfm',
    complexity: 'basic'
  },

  'nested_list': {
    id: 'nested_list',
    name: 'Nested Lists',
    category: 'Lists',
    description: 'Multi-level nested lists',
    syntax: '- item\\n  - subitem',
    example: '- Parent\\n  - Child\\n    - Grandchild',
    supported: 'core',
    complexity: 'intermediate'
  },

  'definition_list': {
    id: 'definition_list',
    name: 'Definition List',
    category: 'Lists',
    description: 'Definition/description lists',
    syntax: 'Term\\n: Definition',
    example: 'HTML\\n: HyperText Markup Language',
    supported: 'extension',
    complexity: 'advanced'
  },

  // === LINKS AND MEDIA ===
  'link': {
    id: 'link',
    name: 'Link',
    category: 'Links & Media',
    description: 'Hyperlink to URL',
    syntax: '[text](url)',
    example: '[Google](https://google.com)',
    supported: 'core',
    complexity: 'basic'
  },

  'image': {
    id: 'image',
    name: 'Image',
    category: 'Links & Media',
    description: 'Embed image',
    syntax: '![alt](url)',
    example: '![Logo](logo.png)',
    supported: 'core',
    complexity: 'basic'
  },

  'reference_link': {
    id: 'reference_link',
    name: 'Reference Link',
    category: 'Links & Media',
    description: 'Reference-style link',
    syntax: '[text][ref]\\n[ref]: url',
    example: '[Google][g]\\n[g]: https://google.com',
    supported: 'core',
    complexity: 'intermediate'
  },

  'autolink': {
    id: 'autolink',
    name: 'Autolink',
    category: 'Links & Media',
    description: 'Automatic URL linking',
    syntax: '<url> or bare URL',
    example: '<https://example.com> or https://example.com',
    supported: 'core',
    complexity: 'basic'
  },

  'image_with_title': {
    id: 'image_with_title',
    name: 'Image with Title',
    category: 'Links & Media',
    description: 'Image with hover title',
    syntax: '![alt](url "title")',
    example: '![Logo](logo.png "Company Logo")',
    supported: 'core',
    complexity: 'intermediate'
  },

  // === TABLES ===
  'table': {
    id: 'table',
    name: 'Table',
    category: 'Tables',
    description: 'Data table with columns',
    syntax: '| Col1 | Col2 |\\n|------|------|\\n| Data | Data |',
    example: '| Name | Age |\\n|------|-----|\\n| John | 25  |',
    supported: 'gfm',
    complexity: 'intermediate'
  },

  'table_alignment': {
    id: 'table_alignment',
    name: 'Table Alignment',
    category: 'Tables',
    description: 'Column alignment in tables',
    syntax: '|:---|:---:|---:|',
    example: '| Left | Center | Right |\\n|:-----|:------:|------:|',
    supported: 'gfm',
    complexity: 'advanced'
  },

  // === QUOTES AND BLOCKS ===
  'blockquote': {
    id: 'blockquote',
    name: 'Blockquote',
    category: 'Blocks',
    description: 'Quoted text block',
    syntax: '> quote',
    example: '> This is a quote',
    supported: 'core',
    complexity: 'basic'
  },

  'nested_blockquote': {
    id: 'nested_blockquote',
    name: 'Nested Blockquote',
    category: 'Blocks',
    description: 'Multi-level quotes',
    syntax: '> quote\\n>> nested',
    example: '> Parent quote\\n>> Child quote',
    supported: 'core',
    complexity: 'intermediate'
  },

  // === HORIZONTAL RULES ===
  'horizontal_rule': {
    id: 'horizontal_rule',
    name: 'Horizontal Rule',
    category: 'Structure',
    description: 'Horizontal divider line',
    syntax: '--- or *** or ___',
    example: '---',
    supported: 'core',
    complexity: 'basic'
  },

  // === LINE BREAKS ===
  'line_break': {
    id: 'line_break',
    name: 'Line Break',
    category: 'Structure',
    description: 'Force line break',
    syntax: 'text  \\n or text\\\\',
    example: 'First line  \\nSecond line',
    supported: 'core',
    complexity: 'intermediate'
  },

  'paragraph_break': {
    id: 'paragraph_break',
    name: 'Paragraph Break',
    category: 'Structure',
    description: 'Paragraph separation',
    syntax: 'Double newline',
    example: 'First paragraph\\n\\nSecond paragraph',
    supported: 'core',
    complexity: 'basic'
  },

  // === ADVANCED FEATURES ===
  'footnote': {
    id: 'footnote',
    name: 'Footnote',
    category: 'Advanced',
    description: 'Reference footnotes',
    syntax: 'text[^ref]\\n[^ref]: note',
    example: 'This has a footnote[^1]\\n[^1]: This is the footnote',
    supported: 'extension',
    complexity: 'advanced'
  },

  'abbreviation': {
    id: 'abbreviation',
    name: 'Abbreviation',
    category: 'Advanced',
    description: 'Expandable abbreviations',
    syntax: '*[abbr]: definition',
    example: '*[HTML]: HyperText Markup Language',
    supported: 'extension',
    complexity: 'advanced'
  },

  'math_inline': {
    id: 'math_inline',
    name: 'Inline Math',
    category: 'Math',
    description: 'Inline mathematical expressions',
    syntax: '$equation$',
    example: '$E = mc^2$',
    supported: 'extension',
    complexity: 'advanced'
  },

  'math_block': {
    id: 'math_block',
    name: 'Math Block',
    category: 'Math',
    description: 'Block mathematical expressions',
    syntax: '$$\\nequation\\n$$',
    example: '$$\\n\\int_{a}^{b} x^2 dx\\n$$',
    supported: 'extension',
    complexity: 'advanced'
  },

  // === DIAGRAMS ===
  'mermaid_diagram': {
    id: 'mermaid_diagram',
    name: 'Mermaid Diagram',
    category: 'Diagrams',
    description: 'Mermaid flowcharts and diagrams',
    syntax: '```mermaid\\ndiagram\\n```',
    example: '```mermaid\\ngraph TD\\n    A-->B\\n```',
    supported: 'extension',
    complexity: 'advanced'
  },

  'plantuml_diagram': {
    id: 'plantuml_diagram',
    name: 'PlantUML Diagram',
    category: 'Diagrams',
    description: 'PlantUML diagrams',
    syntax: '```plantuml\\ndiagram\\n```',
    example: '```plantuml\\n@startuml\\nA -> B\\n@enduml\\n```',
    supported: 'extension',
    complexity: 'advanced'
  },

  // === TABLE OF CONTENTS ===
  'toc': {
    id: 'toc',
    name: 'Table of Contents',
    category: 'Structure',
    description: 'Auto-generated TOC',
    syntax: '[TOC] or [[TOC]]',
    example: '[TOC]',
    supported: 'extension',
    complexity: 'intermediate'
  },

  // === ADMONITIONS/CALLOUTS ===
  'admonition': {
    id: 'admonition',
    name: 'Admonitions',
    category: 'Advanced',
    description: 'Special callout blocks',
    syntax: '!!! type "title"\\n    content',
    example: '!!! note "Important"\\n    This is noteworthy',
    supported: 'extension',
    complexity: 'advanced'
  },

  // === METADATA ===
  'yaml_frontmatter': {
    id: 'yaml_frontmatter',
    name: 'YAML Frontmatter',
    category: 'Metadata',
    description: 'Document metadata',
    syntax: '---\\nkey: value\\n---',
    example: '---\\ntitle: Document\\nauthor: John\\n---',
    supported: 'extension',
    complexity: 'advanced'
  },

  // === HTML INTEGRATION ===
  'html_tags': {
    id: 'html_tags',
    name: 'HTML Tags',
    category: 'HTML',
    description: 'Inline HTML elements',
    syntax: '<tag>content</tag>',
    example: '<span style="color: red">Red text</span>',
    supported: 'core',
    complexity: 'advanced'
  },

  'html_blocks': {
    id: 'html_blocks',
    name: 'HTML Blocks',
    category: 'HTML',
    description: 'Block-level HTML',
    syntax: '<div>\\ncontent\\n</div>',
    example: '<div class="note">\\nSpecial content\\n</div>',
    supported: 'core',
    complexity: 'advanced'
  },

  // === EMOJI ===
  'emoji_shortcode': {
    id: 'emoji_shortcode',
    name: 'Emoji Shortcodes',
    category: 'Text Formatting',
    description: 'Emoji via shortcodes',
    syntax: ':shortcode:',
    example: ':smile: :rocket: :heart:',
    supported: 'extension',
    complexity: 'intermediate'
  },

  // === SPECIAL CHARACTERS ===
  'escape_characters': {
    id: 'escape_characters',
    name: 'Escape Characters',
    category: 'Advanced',
    description: 'Escape markdown syntax',
    syntax: '\\character',
    example: '\\*not italic\\* \\#not header',
    supported: 'core',
    complexity: 'intermediate'
  }
};

/**
 * FEATURE CATEGORIES FOR ORGANIZATION
 */
export const MARKDOWN_CATEGORIES = {
  'Text Formatting': 'Basic text styling (bold, italic, etc.)',
  'Structure': 'Document structure (headers, breaks, etc.)',
  'Code': 'Code formatting and syntax highlighting',
  'Lists': 'Various list types and formats',
  'Links & Media': 'Links, images, and media embedding',
  'Tables': 'Tabular data formatting',
  'Blocks': 'Block-level content (quotes, etc.)',
  'Advanced': 'Advanced markdown features',
  'Math': 'Mathematical expressions and formulas',
  'Diagrams': 'Charts, graphs, and diagrams',
  'Metadata': 'Document metadata and frontmatter',
  'HTML': 'HTML integration features',
} as const;

/**
 * SUPPORT LEVELS
 */
export const SUPPORT_LEVELS = {
  'core': 'Standard Markdown (CommonMark)',
  'gfm': 'GitHub Flavored Markdown',
  'extension': 'Requires specific extensions/plugins'
} as const;

/**
 * COMPLEXITY LEVELS
 */
export const COMPLEXITY_LEVELS = {
  'basic': 'Easy to use, beginner-friendly',
  'intermediate': 'Some markdown experience helpful',
  'advanced': 'Advanced users, complex syntax'
} as const;

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): IMarkdownFeature[] {
  return Object.values(MARKDOWN_FEATURES).filter(
    feature => feature.category === category
  );
}

/**
 * Get features by support level
 */
export function getFeaturesBySupport(support: 'core' | 'gfm' | 'extension'): IMarkdownFeature[] {
  return Object.values(MARKDOWN_FEATURES).filter(
    feature => feature.supported === support
  );
}

/**
 * Get features by complexity
 */
export function getFeaturesByComplexity(complexity: 'basic' | 'intermediate' | 'advanced'): IMarkdownFeature[] {
  return Object.values(MARKDOWN_FEATURES).filter(
    feature => feature.complexity === complexity
  );
}

/**
 * Search features
 */
export function searchFeatures(query: string): IMarkdownFeature[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(MARKDOWN_FEATURES).filter(
    feature => 
      feature.name.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery) ||
      feature.syntax.toLowerCase().includes(lowerQuery)
  );
}

/**
 * TOOLBAR FEATURE MAPPING
 * Maps our toolbar buttons to markdown features
 */
export const BUTTON_FEATURE_MAP = {
  'fmt.bold': ['bold'],
  'fmt.italic': ['italic'],
  'fmt.strike': ['strikethrough'],
  'code.inline': ['inline_code'],
  'code.block': ['code_block'],
  'list.toggle': ['bullet_list', 'numbered_list'],
  'task.toggle': ['task_list'],
  'link.insert': ['link'],
  'image.insert': ['image'],
  'table.menu': ['table', 'table_alignment'],
  'toc.create': ['toc'],
  'preview.side': [], // Preview functionality
  'lint.fix': [], // Quality tooling
} as const;

/**
 * Get total feature count
 */
export const TOTAL_MARKDOWN_FEATURES = Object.keys(MARKDOWN_FEATURES).length;

/**
 * Feature coverage statistics
 */
export const FEATURE_STATS = {
  total: TOTAL_MARKDOWN_FEATURES,
  bySupport: {
    core: getFeaturesBySupport('core').length,
    gfm: getFeaturesBySupport('gfm').length,
    extension: getFeaturesBySupport('extension').length
  },
  byComplexity: {
    basic: getFeaturesByComplexity('basic').length,
    intermediate: getFeaturesByComplexity('intermediate').length,
    advanced: getFeaturesByComplexity('advanced').length
  },
  byCategory: Object.keys(MARKDOWN_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = getFeaturesByCategory(cat).length;
    return acc;
  }, {} as Record<string, number>)
};