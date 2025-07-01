import { describe, expect, test } from 'vitest';
import { calculateTotal } from './calculateTotal'

describe('calculateTotal', () => {
  test('handles comma-separated values', () => {
    expect(calculateTotal('100,200,300')).toBe(600);
    expect(calculateTotal('50.5, 25.5, 10')).toBe(86);
    expect(calculateTotal('1,2,3,4,5')).toBe(15);
  });

  test('handles newline-separated values', () => {
    expect(calculateTotal('100\n200\n300')).toBe(600);
    expect(calculateTotal('10\n20\n30')).toBe(60);
    expect(calculateTotal('1.1\n2.2\n3.3')).toBe(6.6);
  });

  test('handles mixed separators', () => {
    expect(calculateTotal('100,200\n300')).toBe(600);
    expect(calculateTotal('10\n20,30')).toBe(60);
    expect(calculateTotal('1,2\n3,4\n5')).toBe(15);
  });

  test('ignores empty values and whitespace', () => {
    expect(calculateTotal('100, , 200')).toBe(300);
    expect(calculateTotal('\n\n100\n\n\n200\n')).toBe(300);
    expect(calculateTotal('  50  ,  100  ')).toBe(150);
  });

  test('handles invalid numbers', () => {
    expect(calculateTotal('100, abc, 200')).toBe(300);
    expect(calculateTotal('invalid\n100')).toBe(100);
    expect(calculateTotal('10, twenty, 30')).toBe(40);
  });

  test('handles decimal numbers', () => {
    expect(calculateTotal('1.1, 2.2, 3.3')).toBe(6.6);
    expect(calculateTotal('0.1\n0.2\n0.3')).toBeCloseTo(0.6);
    expect(calculateTotal('10.5,20.5')).toBe(31);
  });

  test('returns 0 for empty input', () => {
    expect(calculateTotal('')).toBe(0);
    expect(calculateTotal('   ')).toBe(0);
    expect(calculateTotal(',\n, ,\n')).toBe(0);
  });

  test('handles large numbers', () => {
    expect(calculateTotal('1000000,2000000')).toBe(3000000);
    expect(calculateTotal('999999.99\n0.01')).toBe(1000000);
  });

  test('handles negative numbers', () => {
    expect(calculateTotal('100,-50')).toBe(50);
    expect(calculateTotal('-10\n-20\n30')).toBe(0);
    expect(calculateTotal('100, -abc, 50')).toBe(150);
  });
});