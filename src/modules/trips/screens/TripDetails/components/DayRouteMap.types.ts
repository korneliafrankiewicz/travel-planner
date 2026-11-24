import type { DayRoute } from '../utils/route';

export type DayRouteMapProps = {
  route: DayRoute;
  // The distance of each leg of the route, already written out ("1.2 km").
  distanceLabels: string[];
};
