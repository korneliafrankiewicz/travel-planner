import {
  DEFAULT_PICKER_REGION,
  formatCoordinate,
  getFormCoordinates,
  getPickerRegion,
  toPickedCoordinates,
} from './pickedLocation';

describe('toPickedCoordinates', () => {
  it('rounds to six decimals', () => {
    expect(toPickedCoordinates({ latitude: 38.72234567891, longitude: -9.13931234567 })).toEqual({
      latitude: 38.722346,
      longitude: -9.139312,
    });
  });

  it('keeps a point that is already valid', () => {
    expect(toPickedCoordinates({ latitude: -90, longitude: 180 })).toEqual({
      latitude: -90,
      longitude: 180,
    });
  });

  it.each([
    [190, -170],
    [-190, 170],
    [540, -180],
    [-181, 179],
    [360, 0],
  ])('wraps a longitude of %p (a map panned past the date line) to %p', (longitude, expected) => {
    expect(toPickedCoordinates({ latitude: 0, longitude }).longitude).toBe(expected);
  });

  it('keeps the latitude within the poles', () => {
    expect(toPickedCoordinates({ latitude: 95, longitude: 0 }).latitude).toBe(90);
    expect(toPickedCoordinates({ latitude: -95, longitude: 0 }).latitude).toBe(-90);
  });
});

describe('formatCoordinate', () => {
  it.each([
    [38.7223, '38.7223'],
    [-9.1393, '-9.1393'],
    [0, '0'],
    [50.123456789, '50.123457'],
    [0.000001, '0.000001'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatCoordinate(value)).toBe(expected);
  });
});

describe('getFormCoordinates', () => {
  it('reads valid text, including a decimal comma', () => {
    expect(getFormCoordinates({ latitude: '38.7', longitude: '-9,1' })).toEqual({
      latitude: 38.7,
      longitude: -9.1,
    });
  });

  it.each([
    ['', ''],
    ['38.7', ''],
    ['', '-9.1'],
    ['abc', '-9.1'],
    ['95', '10'],
  ])('is null for %p and %p', (latitude, longitude) => {
    expect(getFormCoordinates({ latitude, longitude })).toBeNull();
  });
});

describe('getPickerRegion', () => {
  const place = { latitude: 38.7, longitude: -9.1 };
  const others = [
    { latitude: 38, longitude: -10 },
    { latitude: 40, longitude: -8 },
  ];

  it('starts on the stop’s own place when it has one, ignoring the other stops', () => {
    expect(getPickerRegion(place, others)).toMatchObject({ latitude: 38.7, longitude: -9.1 });
  });

  it('starts around the trip’s other places when the stop has none', () => {
    expect(getPickerRegion(null, others)).toMatchObject({ latitude: 39, longitude: -9 });
  });

  it('starts on Europe when there is nothing to go by', () => {
    expect(getPickerRegion(null, [])).toBe(DEFAULT_PICKER_REGION);
  });
});
