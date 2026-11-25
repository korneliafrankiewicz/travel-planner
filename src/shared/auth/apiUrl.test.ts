import { ApiConfigError, resolveApiTarget } from './apiUrl';

const resolve = (configured: string | undefined, options: { hostUri?: string; isDev?: boolean } = {}) =>
  resolveApiTarget({ configured, hostUri: options.hostUri, isDev: options.isDev ?? true });

describe('resolveApiTarget', () => {
  describe('without a setting', () => {
    it.each([undefined, '', '   '])('uses the stand-in service for %p', (configured) => {
      expect(resolve(configured)).toEqual({ kind: 'fake' });
      expect(resolve(configured, { isDev: false })).toEqual({ kind: 'fake' });
    });
  });

  describe('auto', () => {
    it('finds the computer that runs the Expo dev server, so a phone can reach it', () => {
      expect(resolve('auto', { hostUri: '192.168.1.20:8081' })).toEqual({
        kind: 'http',
        baseUrl: 'http://192.168.1.20:3000',
      });
    });

    it.each([
      ['localhost:8081', 'http://localhost:3000'],
      ['10.0.2.2:8081', 'http://10.0.2.2:3000'],
      ['my-mac.local:8081', 'http://my-mac.local:3000'],
      ['192.168.1.20', 'http://192.168.1.20:3000'],
      ['exp://192.168.1.20:8081', 'http://192.168.1.20:3000'],
      ['[fe80::1]:8081', 'http://[fe80::1]:3000'],
      ['192.168.1.20:8081/--/path', 'http://192.168.1.20:3000'],
    ])('reads the address from %p', (hostUri, baseUrl) => {
      expect(resolve('auto', { hostUri })).toEqual({ kind: 'http', baseUrl });
    });

    it.each([undefined, '', '   ', ':8081'])('falls back to localhost when Expo gives %p', (hostUri) => {
      expect(resolve('auto', { hostUri })).toEqual({ kind: 'http', baseUrl: 'http://localhost:3000' });
    });

    it('is refused outside development, where there is no dev server to find', () => {
      expect(() => resolve('auto', { isDev: false, hostUri: '192.168.1.20:8081' })).toThrow(ApiConfigError);
    });
  });

  describe('an address', () => {
    it('is used as it is, without a trailing slash', () => {
      expect(resolve('https://api.example.com')).toEqual({ kind: 'http', baseUrl: 'https://api.example.com' });
      expect(resolve('https://api.example.com/')).toEqual({ kind: 'http', baseUrl: 'https://api.example.com' });
      expect(resolve('  https://api.example.com  ')).toEqual({ kind: 'http', baseUrl: 'https://api.example.com' });
    });

    it('may have a path, which is kept', () => {
      expect(resolve('https://example.com/api/')).toEqual({ kind: 'http', baseUrl: 'https://example.com/api' });
    });

    it('may have a port', () => {
      expect(resolve('https://example.com:8443')).toEqual({ kind: 'http', baseUrl: 'https://example.com:8443' });
    });

    it('may be plain http in development, for a server on the same network', () => {
      expect(resolve('http://192.168.1.20:3000', { isDev: true })).toEqual({
        kind: 'http',
        baseUrl: 'http://192.168.1.20:3000',
      });
    });

    it('must be https outside development, because passwords and tokens travel to it', () => {
      expect(() => resolve('http://api.example.com', { isDev: false })).toThrow(/https/);
      expect(resolve('https://api.example.com', { isDev: false })).toEqual({
        kind: 'http',
        baseUrl: 'https://api.example.com',
      });
    });

    it.each([
      ['text that is not an address', 'not a url'],
      ['an address without a scheme', 'api.example.com'],
      ['another scheme', 'ftp://api.example.com'],
      ['a script', 'javascript:alert(1)'],
      ['a user name and password', 'https://user:secret@api.example.com'],
      ['a user name', 'https://user@api.example.com'],
      ['a query', 'https://api.example.com?x=1'],
      ['a fragment', 'https://api.example.com#top'],
    ])('is refused with %s', (_name, configured) => {
      expect(() => resolve(configured)).toThrow(ApiConfigError);
    });

    it('never repeats a password that was put in it by mistake', () => {
      try {
        resolve('https://user:topsecret@api.example.com');
      } catch (error) {
        expect((error as Error).message).not.toContain('topsecret');
        return;
      }
      throw new Error('it should have been refused');
    });
  });
});
