import { describe, it, expect, beforeEach } from 'vitest';
import { ContextDetector } from '../../../src/engine/ContextDetector';

describe('ContextDetector', () => {
  let detector: ContextDetector;

  beforeEach(() => {
    detector = new ContextDetector();
  });

  describe('Bold Context Detection', () => {
    it('should detect when cursor is inside bold text', () => {
      const context = detector.detectContext('**bold text**', 5);
      expect(context.isBold).toBe(true);
      expect(context.boldRange).toEqual({ start: 0, end: 13 });
    });

    it('should detect when selection spans bold text', () => {
      const context = detector.detectContext('**bold** normal', 2, 8);
      expect(context.isBold).toBe(true);
    });

    it('should not detect bold when cursor is outside', () => {
      const context = detector.detectContext('**bold** normal', 10);
      expect(context.isBold).toBe(false);
    });

    it('should handle multiple bold sections', () => {
      const text = '**first** and **second** bold';
      const context = detector.detectContext(text, 20);
      expect(context.isBold).toBe(true);
      expect(context.boldRange?.start).toBe(14);
    });
  });

  describe('Italic Context Detection', () => {
    it('should detect when cursor is inside italic text', () => {
      const context = detector.detectContext('*italic text*', 5);
      expect(context.isItalic).toBe(true);
      expect(context.italicRange).toEqual({ start: 0, end: 13 });
    });

    it('should detect underscore italic formatting', () => {
      const context = detector.detectContext('_italic text_', 5);
      expect(context.isItalic).toBe(true);
    });

    it('should not confuse with bold formatting', () => {
      const context = detector.detectContext('**bold text**', 5);
      expect(context.isItalic).toBe(false);
      expect(context.isBold).toBe(true);
    });

    it('should handle nested formatting', () => {
      const context = detector.detectContext('**bold with *italic* inside**', 15);
      expect(context.isItalic).toBe(true);
      expect(context.isBold).toBe(true);
    });
  });

  describe('Code Context Detection', () => {
    it('should detect when cursor is inside code text', () => {
      const context = detector.detectContext('`code text`', 5);
      expect(context.isCode).toBe(true);
      expect(context.codeRange).toEqual({ start: 0, end: 11 });
    });

    it('should not detect code when cursor is outside', () => {
      const context = detector.detectContext('`code` normal', 8);
      expect(context.isCode).toBe(false);
    });

    it('should handle multiple code spans', () => {
      const text = '`first` and `second` code';
      const context = detector.detectContext(text, 15);
      expect(context.isCode).toBe(true);
    });
  });

  describe('Link Context Detection', () => {
    it('should detect link context and extract components', () => {
      const context = detector.detectContext('[text](url)', 3);
      expect(context.isLink).toBe(true);
      expect(context.linkText).toBe('text');
      expect(context.linkUrl).toBe('url');
    });

    it('should detect when cursor is in link text', () => {
      const context = detector.detectContext('[GitHub](https://github.com)', 4);
      expect(context.isLink).toBe(true);
      expect(context.linkText).toBe('GitHub');
      expect(context.linkUrl).toBe('https://github.com');
    });

    it('should detect when cursor is in URL part', () => {
      const context = detector.detectContext('[GitHub](https://github.com)', 20);
      expect(context.isLink).toBe(true);
    });

    it('should not detect link when cursor is outside', () => {
      const context = detector.detectContext('[link](url) normal', 15);
      expect(context.isLink).toBe(false);
    });
  });

  describe('List Context Detection', () => {
    it('should detect bullet list context', () => {
      const context = detector.detectContext('- List item', 3);
      expect(context.isList).toBe(true);
      expect(context.listType).toBe('bullet');
    });

    it('should detect numbered list context', () => {
      const context = detector.detectContext('1. Numbered item', 5);
      expect(context.isList).toBe(true);
      expect(context.listType).toBe('numbered');
    });

    it('should detect different bullet markers', () => {
      const asteriskContext = detector.detectContext('* Asterisk list', 3);
      expect(asteriskContext.isList).toBe(true);
      expect(asteriskContext.listType).toBe('bullet');

      const plusContext = detector.detectContext('+ Plus list', 3);
      expect(plusContext.isList).toBe(true);
      expect(plusContext.listType).toBe('bullet');
    });

    it('should not detect list when not on list line', () => {
      const context = detector.detectContext('- List item\nNormal text', 15);
      expect(context.isList).toBe(false);
      expect(context.listType).toBe('none');
    });

    it('should handle multi-line lists', () => {
      const text = '- First item\n- Second item\n- Third item';
      const context = detector.detectContext(text, 20); // Position in second item
      expect(context.isList).toBe(true);
      expect(context.listType).toBe('bullet');
    });
  });

  describe('Complex Context Detection', () => {
    it('should detect multiple formatting types', () => {
      const text = '**bold *italic* text**';
      const context = detector.detectContext(text, 10); // Inside italic part
      expect(context.isBold).toBe(true);
      expect(context.isItalic).toBe(true);
    });

    it('should handle formatting in list items', () => {
      const text = '- **Bold** list item';
      const context = detector.detectContext(text, 5); // Inside bold text
      expect(context.isList).toBe(true);
      expect(context.isBold).toBe(true);
    });

    it('should handle links in formatted text', () => {
      const text = '**Bold [link](url) text**';
      const context = detector.detectContext(text, 12); // Inside link
      expect(context.isBold).toBe(true);
      expect(context.isLink).toBe(true);
    });
  });

  describe('getLineAt method', () => {
    it('should return correct line information', () => {
      const text = 'First line\nSecond line\nThird line';
      const lineInfo = detector.getLineAt(text, 15); // Position in second line
      expect(lineInfo.text).toBe('Second line');
      expect(lineInfo.start).toBe(11);
      expect(lineInfo.end).toBe(22);
    });

    it('should handle position at line boundary', () => {
      const text = 'First line\nSecond line';
      const lineInfo = detector.getLineAt(text, 10); // Position at newline
      expect(lineInfo.text).toBe('First line');
    });

    it('should handle position beyond text', () => {
      const text = 'Single line';
      const lineInfo = detector.getLineAt(text, 100);
      expect(lineInfo.text).toBe('Single line');
    });

    it('should handle empty lines', () => {
      const text = 'Line 1\n\nLine 3';
      const lineInfo = detector.getLineAt(text, 7); // Position in empty line
      expect(lineInfo.text).toBe('');
    });
  });
});
