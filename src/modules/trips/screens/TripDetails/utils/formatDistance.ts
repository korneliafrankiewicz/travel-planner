import type { TFunction } from 'i18next';

import { toFormattedDistance } from './route';

// "420 m", "1.2 km" (in Polish "1,2 km"). Rounded, because a straight line between two stops
// is only an estimate.
export const formatDistance = (t: TFunction<'trips'>, meters: number, language: string): string => {
  const { unit, value } = toFormattedDistance(meters);
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);
  return t(unit === 'meters' ? 'distance.meters' : 'distance.kilometers', { value: number });
};
