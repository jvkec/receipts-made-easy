import { parseReceiptText } from '../lib/imageProcessing';

describe('parseReceiptText', () => {
  test('extracts date in common formats', () => {
    const text = `
      STORE NAME
      03/15/2024
      Item 1 $5.99
    `;
    const result = parseReceiptText(text);
    expect(result.date).toBe('03/15/2024');
  });

  test('extracts vendor from first line', () => {
    const text = `
      WALMART
      123 Main St
      Item 1 $5.99
    `;
    const result = parseReceiptText(text);
    expect(result.vendor).toBe('WALMART');
  });

  test('extracts total amount', () => {
    const text = `
      Item 1 $5.99
      Item 2 $3.99
      TOTAL $9.98
    `;
    const result = parseReceiptText(text);
    expect(result.amount).toBe(9.98);
  });

  test('handles empty text', () => {
    const result = parseReceiptText('');
    expect(result).toEqual({});
  });
}); 