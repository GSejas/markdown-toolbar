# Smart Formatting Engine: Context Detection and Toggle Logic

## Overview

The heart of the markdown toolbar extension lies in its smart formatting engine that can detect existing formatting contexts and intelligently toggle formatting on and off. This article explores the technical implementation of context detection and the complex logic required for seamless formatting experiences.

## Context Detection Architecture

### The Challenge

Traditional markdown formatters simply wrap selected text with markers. Our approach is more sophisticated:

1. **Detect Current Context**: Is the cursor inside existing formatting?
2. **Handle Partial Selections**: What if selection partially overlaps with formatted text?
3. **Smart Toggle**: Should we add or remove formatting based on context?
4. **Preserve Intent**: Maintain user expectations for common editing operations

### Core Components

#### 1. Context Detector (`src/engine/ContextDetector.ts`)

The `ContextDetector` uses regex patterns to identify formatting at cursor positions:

```typescript
export interface IMarkdownContext {
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
  isLink: boolean;
  isList: boolean;
  boldRange?: { start: number; end: number };
  linkText?: string;
  linkUrl?: string;
  listType?: 'bullet' | 'numbered' | 'none';
}

export class ContextDetector {
  public detectContext(text: string, position: number, selectionEnd?: number): IMarkdownContext {
    // Detect all formatting types at current position
    // Return comprehensive context information
  }
}
```

#### 2. Range Overlap Detection

A key utility for determining how selections interact with existing formatting:

```typescript
private rangesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && end1 > start2;
}
```

This simple function enables complex selection logic throughout the formatter.

## Formatting Logic Deep Dive

### Bold Formatting Case Study

The bold formatter demonstrates the complexity of smart toggle logic:

```typescript
public formatBold(text: string, selectionStart: number, selectionEnd: number): IFormattingResult {
  const context = this.contextDetector.detectContext(text, selectionStart, selectionEnd);
  
  // Case 1: Already bold - remove formatting
  if (context.isBold && context.boldRange) {
    return this.handleBoldRemoval(text, selectionStart, selectionEnd, context.boldRange);
  }
  
  // Case 2: No selection - insert template
  if (selectionStart === selectionEnd) {
    return this.insertBoldTemplate(text, selectionStart);
  }
  
  // Case 3: Apply bold to selection
  return this.applyBoldFormatting(text, selectionStart, selectionEnd);
}
```

### Complex Selection Scenarios

#### Scenario 1: Full Coverage
```
Selection: **bold text**
Result:   bold text
```
When selection covers the entire bold range including markers, remove formatting entirely.

#### Scenario 2: Inside Existing Bold
```
Text: **bold text**
Cursor position: 5 (inside "bold")
Result: bold text (remove bold formatting)
```

#### Scenario 3: Partial Overlap
```
Text: **hello** world
Selection: "llo** wor"
Result: **hello world**
```
This is the most complex case - merge the selection with existing bold range, remove embedded markers, and reapply bold to the union.

### Implementation of Partial Overlap

```typescript
// Partial overlap: merge selection and bold range
const unionStart = Math.min(selectionStart, boldStart);
const unionEnd = Math.max(selectionEnd, boldEnd);
let unionText = text.substring(unionStart, unionEnd);

// Remove any bold markers inside the union
unionText = unionText.replace(/\*\*/g, '');

// Apply bold to the merged text
const newText = text.substring(0, unionStart) + 
                `**${unionText}**` + 
                text.substring(unionEnd);

return {
  text: newText,
  selectionStart: unionStart + 2,
  selectionEnd: unionStart + 2 + unionText.length
};
```

## Advanced Context Detection

### Nested Formatting

The context detector handles nested scenarios like bold text containing italic:

```typescript
// Text: **bold with *italic* inside**
private detectItalicContext(text: string, start: number, end: number, context: IMarkdownContext): void {
  // Use negative lookbehind to avoid matching ** patterns
  const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|_([^_]+)_/g;
  
  while ((match = italicRegex.exec(text)) !== null) {
    if (this.rangesOverlap(start, end, match.index, match.index + match[0].length)) {
      context.isItalic = true;
      context.italicRange = { start: match.index, end: match.index + match[0].length };
      break;
    }
  }
}
```

### Link Context Extraction

Links require extracting both text and URL components:

```typescript
private detectLinkContext(text: string, start: number, end: number, context: IMarkdownContext): void {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    if (this.rangesOverlap(start, end, match.index, match.index + match[0].length)) {
      context.isLink = true;
      context.linkRange = { start: match.index, end: match.index + match[0].length };
      context.linkText = match[1];  // Text inside brackets
      context.linkUrl = match[2];   // URL inside parentheses
      break;
    }
  }
}
```

### List Context Detection

List detection operates on line boundaries:

```typescript
private detectListContext(text: string, position: number, context: IMarkdownContext): void {
  const lineInfo = this.getLineAt(text, position);
  const trimmedLine = lineInfo.text.trim();
  
  if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('+ ')) {
    context.isList = true;
    context.listType = 'bullet';
  } else if (/^\d+\.\s/.test(trimmedLine)) {
    context.isList = true;
    context.listType = 'numbered';
  } else {
    context.listType = 'none';
  }
}
```

## List Formatting Intelligence

### Mixed List Type Normalization

When users select multiple list items of different types, the formatter normalizes them:

```typescript
public formatList(text: string, selectionStart: number, selectionEnd: number, listType: 'bullet' | 'numbered' = 'bullet'): IFormattingResult {
  const lines = selectedText.split('\n');
  
  // Analyze each line
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

  if (allAreLists && allSameType) {
    // Toggle off - remove all markers
    return { text: lineInfos.map(info => info.text).join('\n') };
  } else if (allAreLists && !allSameType) {
    // Mixed types - normalize to bullets
    return { text: lineInfos.map(info => `- ${info.text.trim()}`).join('\n') };
  } else {
    // Add formatting
    return { text: formatAsRequestedListType(lines, listType) };
  }
}
```

## Testing Strategy for Complex Logic

### Edge Case Coverage

The complexity of formatting logic requires comprehensive test coverage:

```typescript
describe('Bold Formatting Edge Cases', () => {
  it('should handle partial bold selection at start', () => {
    const result = formatter.formatBold('**hello** world', 0, 5);
    expect(result.text).toBe('**hello world**');
  });

  it('should handle partial bold selection at end', () => {
    const result = formatter.formatBold('**hello** world', 5, 15);
    expect(result.text).toBe('**hello world**');
  });

  it('should remove bold when selection covers entire range', () => {
    const result = formatter.formatBold('**hello**', 0, 9);
    expect(result.text).toBe('hello');
  });

  it('should toggle off when cursor inside bold text', () => {
    const result = formatter.formatBold('**hello**', 4, 4);
    expect(result.text).toBe('hello');
  });
});
```

### Fixture-Based Testing

Using realistic markdown samples for integration-style unit tests:

```typescript
// test/fixtures/markdown-samples.ts
export const markdownSamples = {
  nestedFormatting: '**bold with *italic* inside**',
  mixedLists: '- Item 1\n1. Item 2\n- Item 3',
  complexFormatting: '## Header\n\n**Bold** text with [link](url) and `code`'
};
```

## Performance Considerations

### Regex Optimization

Context detection uses compiled regex patterns for efficiency:

```typescript
class ContextDetector {
  private static readonly BOLD_REGEX = /\*\*(.*?)\*\*/g;
  private static readonly ITALIC_REGEX = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|_([^_]+)_/g;
  private static readonly CODE_REGEX = /`([^`]+)`/g;
  private static readonly LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
}
```

### Early Exit Strategies

Context detection stops at first match for performance:

```typescript
while ((match = boldRegex.exec(text)) !== null) {
  if (this.rangesOverlap(start, end, matchStart, matchEnd)) {
    context.isBold = true;
    context.boldRange = { start: matchStart, end: matchEnd };
    break; // Exit early - found the relevant context
  }
}
```

## Real-World Usage Patterns

### User Expectations

1. **Selection-based formatting**: Select text and click button to format
2. **Toggle behavior**: Click button again to remove formatting
3. **Cursor-based insertion**: No selection creates template text
4. **Smart expansion**: Partial selections expand intelligently

### Common Edge Cases

1. **Multiple bold sections**: Only affect the one containing cursor
2. **Nested formatting**: Preserve outer formatting when toggling inner
3. **Empty lines in lists**: Preserve spacing when adding list markers
4. **URL validation**: Provide feedback for invalid URLs in links

## Future Enhancements

### Multi-Cursor Support

Extending the engine to handle multiple cursors:

```typescript
public formatBoldMultiple(text: string, selections: Array<{start: number, end: number}>): IFormattingResult {
  // Process selections in reverse order to maintain position integrity
  const sortedSelections = selections.sort((a, b) => b.start - a.start);
  
  let workingText = text;
  for (const selection of sortedSelections) {
    const result = this.formatBold(workingText, selection.start, selection.end);
    workingText = result.text;
  }
  
  return { text: workingText, /* updated selections */ };
}
```

### Custom Format Patterns

Allowing users to define custom formatting:

```typescript
interface ICustomFormat {
  id: string;
  pattern: { start: string; end: string };
  regex: RegExp;
  description: string;
}

// User could define: strikethrough as ~~text~~
const customFormats: ICustomFormat[] = [
  {
    id: 'strikethrough',
    pattern: { start: '~~', end: '~~' },
    regex: /~~(.*?)~~/g,
    description: 'Strikethrough text'
  }
];
```

## Conclusion

The smart formatting engine demonstrates that sophisticated user experiences require careful consideration of edge cases and user intent. Key principles:

1. **Context Awareness**: Understand existing formatting state
2. **Intent Preservation**: Make formatting decisions that match user expectations  
3. **Comprehensive Testing**: Edge cases are common in text manipulation
4. **Performance Balance**: Sophisticated logic must remain responsive

The result is a formatting experience that feels intuitive and intelligent, reducing cognitive load for users while handling complex scenarios gracefully.
