/**
 * @moduleName: Markdown Formatter Engine - Pure Logic Layer
 * @version: 1.0.0
 * @since: 2025-08-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Pure business logic for markdown text formatting operations with no VS Code dependencies
 * @techStack: TypeScript, Regular Expressions
 * @dependency: None (pure logic)
 * @interModuleDependency: ./ContextDetector
 * @requirementsTraceability:
 *   {@link Requirements.REQ_ENGINE_001} (Bold Formatting Logic)
 *   {@link Requirements.REQ_ENGINE_002} (Italic Formatting Logic)
 *   {@link Requirements.REQ_ENGINE_003} (Code Formatting Logic)
 *   {@link Requirements.REQ_ENGINE_004} (Link Formatting Logic)
 *   {@link Requirements.REQ_ENGINE_005} (List Formatting Logic)
 * @briefDescription: Core formatting engine that handles all markdown syntax transformations. Implements smart toggle behavior for bold/italic/code formatting, intelligent link extraction, and context-aware list formatting. Uses regex-based detection and atomic text transformations
 * @methods: formatBold, formatItalic, formatCode, formatLink, formatList, toggleFormatting
 * @contributors: VS Code Extension Team
 * @examples:
 *   - Bold toggle: "**text**" → "text" (removes formatting)
 *   - Link extraction: "[text](url)" → "text" (with URL shown to user)
 *   - List normalization: Mixed bullets → Consistent bullet style
 * @vulnerabilitiesAssessment: Regex-based parsing, input sanitization, no external dependencies, pure function design
 */

import { ContextDetector, IMarkdownContext } from './ContextDetector';

/**
 * Result of a formatting operation
 */
export interface IFormattingResult {
    text: string;
    selectionStart: number;
    selectionEnd: number;
    extractedUrl?: string; // For link operations
}

/**
 * Markdown text formatting engine
 */
export class MarkdownFormatter {
    private contextDetector: ContextDetector;

    constructor() {
        this.contextDetector = new ContextDetector();
    }

    /**
     * Formats text with bold markdown syntax
     * @param text Text to format
     * @param selectionStart Start position of selection
     * @param selectionEnd End position of selection
     * @returns Formatting result
     */
    public formatBold(text: string, selectionStart: number, selectionEnd: number): IFormattingResult {
        const selectedText = text.substring(selectionStart, selectionEnd);
        const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);

        // If already bold, remove bold formatting
        if (context.isBold && context.boldRange) {
            const boldStart = context.boldRange.start;
            const boldEnd = context.boldRange.end;
            const innerText = text.substring(boldStart + 2, boldEnd - 2);

            // If selection covers the entire bold range (including markers) -> remove bold markers
            if (selectionStart <= boldStart && selectionEnd >= boldEnd) {
                const newText = text.substring(0, boldStart) + innerText + text.substring(boldEnd);
                return {
                    text: newText,
                    selectionStart: boldStart,
                    selectionEnd: boldStart + innerText.length
                };
            }

            // If selection is strictly inside the existing bold inner range -> toggle off
            if (selectionStart >= boldStart + 2 && selectionEnd <= boldEnd - 2) {
                const newText = text.substring(0, boldStart) + innerText + text.substring(boldEnd);
                return {
                    text: newText,
                    selectionStart: boldStart,
                    selectionEnd: boldStart + innerText.length
                };
            }

            // Partial overlap: merge selection and bold range, remove existing markers and re-apply bold to union
            const unionStart = Math.min(selectionStart, boldStart);
            const unionEnd = Math.max(selectionEnd, boldEnd);
            let unionText = text.substring(unionStart, unionEnd);
            // Remove any bold markers inside the union
            unionText = unionText.replace(/\*\*/g, '');

            const newText = text.substring(0, unionStart) + `**${unionText}**` + text.substring(unionEnd);
            return {
                text: newText,
                selectionStart: unionStart + 2,
                selectionEnd: unionStart + 2 + unionText.length
            };
        }

        // If no selection, insert template
        if (selectionStart === selectionEnd) {
            const template = '**bold text**';
            const newText = text.substring(0, selectionStart) +
                template +
                text.substring(selectionEnd);

            return {
                text: newText,
                selectionStart: selectionStart + 2,
                selectionEnd: selectionStart + 11
            };
        }

        // Apply bold formatting to selection
        const formattedText = `**${selectedText}**`;
        const newText = text.substring(0, selectionStart) +
            formattedText +
            text.substring(selectionEnd);

        return {
            text: newText,
            selectionStart: selectionStart + 2,
            selectionEnd: selectionStart + 2 + selectedText.length
        };
    }

    /**
     * Formats text with italic markdown syntax
     * @param text Text to format
     * @param selectionStart Start position of selection
     * @param selectionEnd End position of selection
     * @returns Formatting result
     */
    public formatItalic(text: string, selectionStart: number, selectionEnd: number): IFormattingResult {
        const selectedText = text.substring(selectionStart, selectionEnd);
        const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);

        // If already italic, remove italic formatting
        if (context.isItalic && context.italicRange) {
            const marker = text.charAt(context.italicRange.start);
            const innerText = text.substring(context.italicRange.start + 1, context.italicRange.end - 1);
            const newText = text.substring(0, context.italicRange.start) +
                innerText +
                text.substring(context.italicRange.end);

            return {
                text: newText,
                selectionStart: context.italicRange.start,
                selectionEnd: context.italicRange.start + innerText.length
            };
        }

        // If no selection, insert template
        if (selectionStart === selectionEnd) {
            const template = '*italic text*';
            const newText = text.substring(0, selectionStart) +
                template +
                text.substring(selectionEnd);

            return {
                text: newText,
                selectionStart: selectionStart + 1,
                selectionEnd: selectionStart + 12
            };
        }

        // Apply italic formatting to selection
        const formattedText = `*${selectedText}*`;
        const newText = text.substring(0, selectionStart) +
            formattedText +
            text.substring(selectionEnd);

        return {
            text: newText,
            selectionStart: selectionStart + 1,
            selectionEnd: selectionStart + 1 + selectedText.length
        };
    }

    /**
     * Formats text with inline code markdown syntax
     * @param text Text to format
     * @param selectionStart Start position of selection
     * @param selectionEnd End position of selection
     * @returns Formatting result
     */
    public formatCode(text: string, selectionStart: number, selectionEnd: number): IFormattingResult {
        const selectedText = text.substring(selectionStart, selectionEnd);
        const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);

        // If already code, remove code formatting
        if (context.isCode && context.codeRange) {
            const innerText = text.substring(context.codeRange.start + 1, context.codeRange.end - 1);
            const newText = text.substring(0, context.codeRange.start) +
                innerText +
                text.substring(context.codeRange.end);

            return {
                text: newText,
                selectionStart: context.codeRange.start,
                selectionEnd: context.codeRange.start + innerText.length
            };
        }

        // If no selection, insert template
        if (selectionStart === selectionEnd) {
            const template = '`code`';
            const newText = text.substring(0, selectionStart) +
                template +
                text.substring(selectionEnd);

            return {
                text: newText,
                selectionStart: selectionStart + 1,
                selectionEnd: selectionStart + 5
            };
        }

        // Apply code formatting to selection
        const formattedText = `\`${selectedText}\``;
        const newText = text.substring(0, selectionStart) +
            formattedText +
            text.substring(selectionEnd);

        return {
            text: newText,
            selectionStart: selectionStart + 1,
            selectionEnd: selectionStart + 1 + selectedText.length
        };
    }

    /**
     * Formats text with link markdown syntax
     * @param text Text to format
     * @param selectionStart Start position of selection
     * @param selectionEnd End position of selection
     * @param url URL for the link
     * @returns Formatting result
     */
    public formatLink(text: string, selectionStart: number, selectionEnd: number, url?: string): IFormattingResult {
        const selectedText = text.substring(selectionStart, selectionEnd);
        const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);

        // If already a link, extract the link text
        if (context.isLink && context.linkRange) {
            const linkText = context.linkText || '';
            const newText = text.substring(0, context.linkRange.start) +
                linkText +
                text.substring(context.linkRange.end);

            return {
                text: newText,
                selectionStart: context.linkRange.start,
                selectionEnd: context.linkRange.start + linkText.length,
                extractedUrl: context.linkUrl
            };
        }

        // If no selection, insert template
        if (selectionStart === selectionEnd) {
            const template = url ? `[link text](${url})` : '[link text](url)';
            const newText = text.substring(0, selectionStart) +
                template +
                text.substring(selectionEnd);

            return {
                text: newText,
                selectionStart: selectionStart + 1,
                selectionEnd: selectionStart + 10
            };
        }

        // Apply link formatting to selection
        const linkUrl = url || 'url';
        const formattedText = `[${selectedText}](${linkUrl})`;
        const newText = text.substring(0, selectionStart) +
            formattedText +
            text.substring(selectionEnd);

        return {
            text: newText,
            selectionStart: selectionStart + 1,
            selectionEnd: selectionStart + 1 + selectedText.length
        };
    }

    /**
     * Formats text with list markdown syntax
     * @param text Text to format
     * @param selectionStart Start position of selection
     * @param selectionEnd End position of selection
     * @param listType Type of list to create ('bullet' | 'numbered')
     * @returns Formatting result
     */
    public formatList(text: string, selectionStart: number, selectionEnd: number, listType: 'bullet' | 'numbered' = 'bullet'): IFormattingResult {
        const selectedText = text.substring(selectionStart, selectionEnd);
        const lines = selectedText.split('\n');

        // Determine list markers presence and types
        const lineInfos = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
                return { type: 'bullet', text: line.replace(/^\s*[-*+]\s/, '') };
            } else if (/^\d+\.\s/.test(trimmed)) {
                return { type: 'numbered', text: line.replace(/^\s*\d+\.\s/, '') };
            }
            return { type: 'none', text: line };
        });

        const allAreLists = lineInfos.every(info => info.type !== 'none');
        const allSameType = allAreLists && lineInfos.every(info => info.type === lineInfos[0].type);

        let formattedLines: string[];

        if (allAreLists && allSameType) {
            // If all lines are lists of the same type -> toggle off (remove markers)
            formattedLines = lineInfos.map(info => info.text);
        } else if (allAreLists && !allSameType) {
            // Mixed list types -> normalize to bullets
            formattedLines = lineInfos.map(info => {
                return info.text.trim() === '' ? info.text : `- ${info.text.trim()}`;
            });
        } else {
            // Add list formatting according to requested type
            formattedLines = lines.map((line, index) => {
                const trimmed = line.trim();
                if (trimmed === '') {
                    return line; // Keep empty lines as-is
                }
                if (listType === 'numbered') {
                    return `${index + 1}. ${trimmed}`;
                } else {
                    return `- ${trimmed}`;
                }
            });
        }

        const formattedText = formattedLines.join('\n');
        const newText = text.substring(0, selectionStart) +
            formattedText +
            text.substring(selectionEnd);

        return {
            text: newText,
            selectionStart,
            selectionEnd: selectionStart + formattedText.length
        };
    }

    /**
     * Validates if a URL is properly formatted
     * @param url URL to validate
     * @returns boolean indicating if URL is valid
     */
    public isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            // Check for relative URLs or anchors
            return /^(\/|#|\.)/.test(url) || /^[a-zA-Z0-9]/.test(url);
        }
    }

    // Simple utility methods for fallback commands

    /**
     * Toggle bullet list formatting for a line
     */
    public toggleBulletList(line: string): string {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            return line.replace(/^\s*-\s+/, '');
        } else if (trimmed.startsWith('* ')) {
            return line.replace(/^\s*\*\s+/, '');
        } else if (trimmed.startsWith('+ ')) {
            return line.replace(/^\s*\+\s+/, '');
        } else {
            return line.replace(/^(\s*)/, '$1- ');
        }
    }

    /**
     * Toggle task list formatting for a line
     */
    public toggleTaskList(line: string): string {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
            return line.replace(/^\s*-\s+\[[ x]\]\s+/, '');
        } else if (trimmed.startsWith('- ')) {
            return line.replace(/^(\s*)-\s+/, '$1- [ ] ');
        } else {
            return line.replace(/^(\s*)/, '$1- [ ] ');
        }
    }

    /**
     * Create a code block
     */
    public createCodeBlock(language: string = ''): string {
        return `\`\`\`${language}\n\n\`\`\``;
    }

    /**
     * Wrap text in code block
     */
    public wrapInCodeBlock(text: string, language: string = ''): string {
        return `\`\`\`${language}\n${text}\n\`\`\``;
    }

    /**
     * Create a markdown link
     */
    public createLink(text: string, url: string): string {
        return `[${text}](${url})`;
    }

    /**
     * Create a markdown image
     */
    public createImage(altText: string, url: string): string {
        return `![${altText}](${url})`;
    }
}
