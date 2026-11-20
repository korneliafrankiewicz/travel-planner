import { getInitials } from './getInitials';

describe('getInitials', () => {
  it.each([
    ['Alex Traveler', 'AT'],
    ['anna maria kowalska', 'AK'],
    ['  anna   maria  kowalska ', 'AK'],
    ['jan', 'J'],
    ['Łukasz', 'Ł'],
    ['Żaneta Śliwa', 'ŻŚ'],
    ['ñoño pérez', 'ÑP'],
  ])('turns %p into %p', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it.each(['', '   ', '\t\n'])('returns a placeholder for %p', (name) => {
    expect(getInitials(name)).toBe('?');
  });

  it('takes whole characters, not half of a surrogate pair', () => {
    expect(getInitials('😀 Bob')).toBe('😀B');
  });
});
