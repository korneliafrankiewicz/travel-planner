import { formatTimeInput } from './timeInput';

describe('formatTimeInput', () => {
  it.each([
    ['', ''],
    ['9', '9'],
    ['09', '09'],
    ['093', '09:3'],
    ['0930', '09:30'],
    ['09:30', '09:30'],
    ['09:30abc', '09:30'],
    ['12345', '12:34'],
    ['ab', ''],
    ['9 30', '93:0'],
    ['١٢٣٤', ''],
  ])('turns %p into %p', (typed, expected) => {
    expect(formatTimeInput(typed)).toBe(expected);
  });

  it('never produces more than 5 characters', () => {
    expect(formatTimeInput('1234567890').length).toBeLessThanOrEqual(5);
  });
});
