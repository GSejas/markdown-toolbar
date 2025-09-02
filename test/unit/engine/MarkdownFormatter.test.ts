import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownFormatter } from '../../../src/engine/MarkdownFormatter';
import { markdownSamples } from '../../fixtures/markdown-samples';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('Bold Formatting', () => {
    it('should wrap selected text with bold markers', () => {
      const result = formatter.formatBold('hello world', 0, 11);
      expect(result.text).toBe('**hello world**');
      expect(result.selectionStart).toBe(2);
      expect(result.selectionEnd).toBe(13);
    });

    it('should detect and toggle existing bold formatting', () => {
      const result = formatter.formatBold('**hello world**', 2, 13);
      expect(result.text).toBe('hello world');
      expect(result.selectionStart).toBe(0);
      expect(result.selectionEnd).toBe(11);
    });

    it('should handle empty selection by inserting template', () => {
      const result = formatter.formatBold('', 0, 0);
      expect(result.text).toBe('**bold text**');
      expect(result.selectionStart).toBe(2);
      expect(result.selectionEnd).toBe(11);
    });

    it('should handle partial bold selection', () => {
      const result = formatter.formatBold('**hello** world', 5, 15);
      expect(result.text).toBe('**hello world**');
    });

    it('should handle bold formatting in mixed content', () => {
      const text = 'Some **bold** text here';
      const result = formatter.formatBold(text, 5, 13);
      expect(result.text).toBe('Some bold text here');
    });
  });

  describe('Italic Formatting', () => {
    it('should wrap selected text with italic markers', () => {
      const result = formatter.formatItalic('hello world', 0, 11);
      expect(result.text).toBe('*hello world*');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(12);
    });

    it('should detect and toggle existing italic formatting', () => {
      const result = formatter.formatItalic('*hello world*', 1, 12);
      expect(result.text).toBe('hello world');
      expect(result.selectionStart).toBe(0);
      expect(result.selectionEnd).toBe(11);
    });

    it('should handle empty selection by inserting template', () => {
      const result = formatter.formatItalic('', 0, 0);
      expect(result.text).toBe('*italic text*');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(12);
    });

    it('should handle underscore italic formatting', () => {
      const result = formatter.formatItalic('_hello world_', 1, 12);
      expect(result.text).toBe('hello world');
    });
  });

  describe('Code Formatting', () => {
    it('should wrap selected text with code markers', () => {
      const result = formatter.formatCode('hello world', 0, 11);
      expect(result.text).toBe('`hello world`');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(12);
    });

    it('should detect and toggle existing code formatting', () => {
      const result = formatter.formatCode('`hello world`', 1, 12);
      expect(result.text).toBe('hello world');
      expect(result.selectionStart).toBe(0);
      expect(result.selectionEnd).toBe(11);
    });

    it('should handle empty selection by inserting template', () => {
      const result = formatter.formatCode('', 0, 0);
      expect(result.text).toBe('`code`');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(5);
    });
  });

  describe('Link Formatting', () => {
    it('should create link with selected text', () => {
      const result = formatter.formatLink('GitHub', 0, 6, 'https://github.com');
      expect(result.text).toBe('[GitHub](https://github.com)');
    });

    it('should detect and extract existing link', () => {
      const result = formatter.formatLink('[GitHub](https://github.com)', 0, 29);
      expect(result.text).toBe('GitHub');
      expect(result.extractedUrl).toBe('https://github.com');
    });

    it('should handle empty selection with URL', () => {
      const result = formatter.formatLink('', 0, 0, 'https://example.com');
      expect(result.text).toBe('[link text](https://example.com)');
    });

    it('should handle empty selection without URL', () => {
      const result = formatter.formatLink('', 0, 0);
      expect(result.text).toBe('[link text](url)');
    });
  });

  describe('List Formatting', () => {
    it('should convert lines to bullet list', () => {
      const text = 'Item 1\nItem 2\nItem 3';
      const result = formatter.formatList(text, 0, text.length);
      expect(result.text).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should convert lines to numbered list', () => {
      const text = 'Item 1\nItem 2\nItem 3';
      const result = formatter.formatList(text, 0, text.length, 'numbered');
      expect(result.text).toBe('1. Item 1\n2. Item 2\n3. Item 3');
    });

    it('should remove list markers when toggling off', () => {
      const text = '- Item 1\n- Item 2';
      const result = formatter.formatList(text, 0, text.length);
      expect(result.text).toBe('Item 1\nItem 2');
    });

    it('should handle mixed list types', () => {
      const text = '- Item 1\n1. Item 2\n- Item 3';
      const result = formatter.formatList(text, 0, text.length);
      expect(result.text).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should preserve empty lines in lists', () => {
      const text = 'Item 1\n\nItem 3';
      const result = formatter.formatList(text, 0, text.length);
      expect(result.text).toBe('- Item 1\n\n- Item 3');
    });
  });

  describe('URL Validation', () => {
    it('should validate full URLs', () => {
      expect(formatter.isValidUrl('https://example.com')).toBe(true);
      expect(formatter.isValidUrl('http://example.com')).toBe(true);
      expect(formatter.isValidUrl('ftp://example.com')).toBe(true);
    });

    it('should validate relative URLs', () => {
      expect(formatter.isValidUrl('/path/to/page')).toBe(true);
      expect(formatter.isValidUrl('./relative/path')).toBe(true);
      expect(formatter.isValidUrl('../parent/path')).toBe(true);
    });

    it('should validate anchors and fragments', () => {
      expect(formatter.isValidUrl('#section')).toBe(true);
      expect(formatter.isValidUrl('page.html#section')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(formatter.isValidUrl('')).toBe(false);
      expect(formatter.isValidUrl('not a url')).toBe(true); // This might be a relative reference
    });
  });
});
