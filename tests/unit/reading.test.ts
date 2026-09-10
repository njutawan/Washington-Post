import { describe, it, expect } from 'vitest';
import { estimateRemaining, countWords } from '@/lib/useReadingState';

describe('reading state utilities', () => {
  it('countWords strips HTML and counts words', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('<p>Hello <b>world</b></p>')).toBe(2);
    expect(countWords('<h1>A</h1><p>b c d</p>')).toBe(4);
  });

  it('estimateRemaining returns minutes left based on progress and 220 wpm', () => {
    // 2200 words @ 0% progress = 10 min left
    expect(estimateRemaining(2200, 0)).toBe('10 min left');
    // 2200 words @ 50% = 5 min left
    expect(estimateRemaining(2200, 0.5)).toBe('5 min left');
    // 2200 words @ 100% = 1 min (floor)
    expect(estimateRemaining(2200, 1)).toBe('1 min left');
    // 110 words @ 0% = 1 min (minimum)
    expect(estimateRemaining(110, 0)).toBe('1 min left');
  });

  it('caps progress at 0-1', () => {
    expect(estimateRemaining(2200, -0.5)).toBe('10 min left');
    expect(estimateRemaining(2200, 2)).toBe('1 min left');
  });
});
