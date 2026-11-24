import { i18n } from '@/shared/i18n';

import { formatDistance } from './formatDistance';

const format = async (meters: number, language: 'en' | 'pl') => {
  await i18n.changeLanguage(language);
  return formatDistance(i18n.getFixedT(language, 'trips'), meters, language);
};

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [423, '420 m'],
    [1240, '1.2 km'],
    [2000, '2 km'],
    [274_000, '274 km'],
  ])('writes %p m in English as %p', async (meters, expected) => {
    expect(await format(meters, 'en')).toBe(expected);
  });

  it('uses the decimal comma in Polish', async () => {
    expect(await format(1240, 'pl')).toBe('1,2 km');
    expect(await format(423, 'pl')).toBe('420 m');
  });
});
