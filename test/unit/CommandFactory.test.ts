import { describe, it, expect, vi } from 'vitest';
import { CommandFactory } from '../../src/commands/CommandFactory';

describe('CommandFactory', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should retrieve registered handlers', () => {
    const handler = CommandFactory.getHandler('mdToolbar.footnote.insert');
    expect(handler).toBeDefined();
    expect(typeof handler?.execute).toBe('function');
  });
});
