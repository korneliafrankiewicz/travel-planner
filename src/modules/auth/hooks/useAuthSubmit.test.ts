import { act, renderHook } from '@testing-library/react-native';

import { AuthError } from '@/shared/auth/types';
import { deferred } from '@/test-utils/authTestUtils';

import { useAuthSubmit } from './useAuthSubmit';

jest.mock('@/shared/auth/authService', () => ({ authService: {} }));

describe('useAuthSubmit', () => {
  it('starts idle, without an error', async () => {
    const { result } = await renderHook(() => useAuthSubmit());
    expect(result.current.submitting).toBe(false);
    expect(result.current.errorKey).toBeNull();
  });

  it('is submitting while the request runs, and resolves true when it worked', async () => {
    const request = deferred();
    const { result } = await renderHook(() => useAuthSubmit());

    let outcome: Promise<boolean>;
    await act(async () => {
      outcome = result.current.run(() => request.promise);
    });
    expect(result.current.submitting).toBe(true);

    await act(async () => request.resolve());
    expect(await outcome!).toBe(true);
    expect(result.current.submitting).toBe(false);
    expect(result.current.errorKey).toBeNull();
  });

  it('refuses a second request while one is running, even one made in the same instant', async () => {
    const request = deferred();
    const first = jest.fn(() => request.promise);
    const second = jest.fn(async () => {});
    const { result } = await renderHook(() => useAuthSubmit());

    let outcomes: Promise<boolean>[] = [];
    await act(async () => {
      // Two quick taps: no render happens in between, so only a guard that does not depend on
      // state can stop the second one.
      outcomes = [result.current.run(first), result.current.run(second)];
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(await outcomes[1]).toBe(false);

    await act(async () => request.resolve());
    expect(await outcomes[0]).toBe(true);
  });

  it('accepts a new request once the earlier one is over', async () => {
    const { result } = await renderHook(() => useAuthSubmit());

    await act(async () => {
      await result.current.run(async () => {});
    });
    const again = jest.fn(async () => {});
    await act(async () => {
      await result.current.run(again);
    });

    expect(again).toHaveBeenCalledTimes(1);
  });

  it('turns a failure of the service into a message, and resolves false', async () => {
    const { result } = await renderHook(() => useAuthSubmit());

    let outcome = true;
    await act(async () => {
      outcome = await result.current.run(async () => {
        throw new AuthError('emailTaken');
      });
    });

    expect(outcome).toBe(false);
    expect(result.current.errorKey).toBe('formErrors.emailTaken');
    expect(result.current.submitting).toBe(false);
  });

  it('gives the general message for a failure that is not from the service', async () => {
    const { result } = await renderHook(() => useAuthSubmit());

    await act(async () => {
      await result.current.run(async () => {
        throw new TypeError('bug');
      });
    });

    expect(result.current.errorKey).toBe('formErrors.unknown');
  });

  it('forgets an earlier error when a new request starts', async () => {
    const { result } = await renderHook(() => useAuthSubmit());
    await act(async () => {
      await result.current.run(async () => {
        throw new AuthError('network');
      });
    });
    expect(result.current.errorKey).not.toBeNull();

    const request = deferred();
    await act(async () => {
      void result.current.run(() => request.promise);
    });

    expect(result.current.errorKey).toBeNull();
    await act(async () => request.resolve());
  });

  it('can clear the error by hand', async () => {
    const { result } = await renderHook(() => useAuthSubmit());
    await act(async () => {
      await result.current.run(async () => {
        throw new AuthError('network');
      });
    });

    await act(async () => result.current.clearError());

    expect(result.current.errorKey).toBeNull();
  });
});
