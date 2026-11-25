import { selectAuthService } from './selectAuthService';

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('selectAuthService', () => {
  it('gives the stand-in when there is no server, and it does not touch the network', async () => {
    jest.useFakeTimers();
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const service = selectAuthService({ kind: 'fake' });

    const login = service.signIn({ email: 'anna@example.com', password: 'anything' });
    await jest.advanceTimersByTimeAsync(700);

    expect(await login).toMatchObject({ user: { email: 'anna@example.com' } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gives the real service, which calls the address it was given, when there is a server', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ status: 200, text: async () => '{"token":"t","user":{"id":"1","name":"A","email":"a@b.co"}}' } as Response);
    const service = selectAuthService({ kind: 'http', baseUrl: 'https://api.example.com' });

    await service.signIn({ email: 'a@b.co', password: 'x' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]![0])).toBe('https://api.example.com/v1/auth/login');
  });
});
