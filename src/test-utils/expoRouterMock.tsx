import { Text } from 'react-native';

// A stand-in for `expo-router` in screen tests. It records navigation instead of navigating,
// and lets a test choose the route params.
//
// In a test file:
//   jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);
//   import { router, setParams, resetRouter } from '@/test-utils/expoRouterMock';

export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
};

let params: Record<string, string | undefined> = {};

export const setParams = (next: Record<string, string | undefined>) => {
  params = next;
};

export const resetRouter = () => {
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
  router.canGoBack.mockReset().mockReturnValue(true);
  params = {};
};

// A redirect shows up on screen as text, so tests can see where the user would be sent.
const Redirect = ({ href }: { href: unknown }) => (
  <Text testID="redirect">{JSON.stringify(href)}</Text>
);

export const expoRouterModule = {
  useRouter: () => router,
  useLocalSearchParams: () => params,
  Redirect,
};
