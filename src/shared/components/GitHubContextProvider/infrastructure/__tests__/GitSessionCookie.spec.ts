import { GitSessionCookie } from '../GitSessionCookie';

const MAX_UNIX_MS = 8640000000000000;

describe('Create GitSessionCookie', () => {
  it('can parse a valid cookie value', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000; // Wed, 10 Apr 2024 15:23:00 GMT
    const value = createCookieValue(metadata, expiry);

    const sessionCookie = GitSessionCookie.decode(value);
    expect(sessionCookie).toEqual(new GitSessionCookie(metadata, expiry));
  });

  it('can parse a valid legacy cookie value', () => {
    const metadata = 'some encrypted secret';
    const value = createLegacyCookieValue(metadata);

    const sessionCookie = GitSessionCookie.decode(value);
    expect(sessionCookie).toEqual(new GitSessionCookie(btoa(metadata), MAX_UNIX_MS));
  });

  it('can parse a valid cookie value with base64 padding', () => {
    const metadata = btoa('some encrypted secret with padding');
    const expiry = 1712762580000; // Wed, 10 Apr 2024 15:23:00 GMT
    const value = createCookieValue(metadata, expiry);

    const sessionCookie = GitSessionCookie.decode(value);
    expect(sessionCookie).toEqual(new GitSessionCookie(metadata, expiry));
  });

  it('can parse a valid legacy cookie value with base64 padding', () => {
    const metadata = 'some encrypted secret with padding';
    const value = createLegacyCookieValue(metadata);

    const sessionCookie = GitSessionCookie.decode(value);
    expect(sessionCookie).toEqual(new GitSessionCookie(btoa(metadata), MAX_UNIX_MS));
  });

  it('returns undefined when given an invalid base64 string', () => {
    // prevent console noise in the output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const illegalValue = 'a===a';
    const sessionCookie = GitSessionCookie.decode(illegalValue);
    expect(sessionCookie).toBeUndefined();
  });

  it('returns undefined when given an empty string', () => {
    const sessionCookie = GitSessionCookie.decode('');
    expect(sessionCookie).toBeUndefined();
  });
});

describe('GitSessionCookie expiry', () => {
  const mockDate = new Date(1712762580000); // Wed Apr 10 2024 15:23:00 UTC // Wed, 10 Apr 2024 15:23:00 GMT

  it('can identify an unexpired token', () => {
    const metadata = 'some encrypted secret';
    const expiry = mockDate.getTime() + 60 * 1000; // Expires 60s in the future.

    jest.useFakeTimers().setSystemTime(mockDate);
    const sessionCookie = new GitSessionCookie(metadata, expiry);

    expect(sessionCookie.isUserTokenExpired()).toBeFalsy();
  });

  it('can identify an expired token', () => {
    const metadata = 'some encrypted secret';
    const expiry = mockDate.getTime() - 60 * 1000; // Expires 60s in the past.

    jest.useFakeTimers().setSystemTime(mockDate);
    const sessionCookie = new GitSessionCookie(metadata, expiry);

    expect(sessionCookie.isUserTokenExpired()).toBeTruthy();
  });

  it('can identify an unexpired token with bias', () => {
    const metadata = 'some encrypted secret';
    const expiry = mockDate.getTime() + 60 * 1000; // Expires 60s in the future.
    const bias = 30 * 1000; // 30s bias.

    jest.useFakeTimers().setSystemTime(mockDate);
    const sessionCookie = new GitSessionCookie(metadata, expiry);

    expect(sessionCookie.isUserTokenExpired(bias)).toBeFalsy();
  });

  it('can identify an expired token with bias', () => {
    const metadata = 'some encrypted secret';
    const expiry = mockDate.getTime() + 60 * 1000; // Expires 60s in the future.
    const bias = 120 * 1000; // 120s bias.

    jest.useFakeTimers().setSystemTime(mockDate);
    const sessionCookie = new GitSessionCookie(metadata, expiry);

    expect(sessionCookie.isUserTokenExpired(bias)).toBeTruthy();
  });
});

function createCookieValue(metadata: string, expiry: number): string {
  const sessionCookie = JSON.stringify({
    metadata: metadata,
    expiry: expiry,
  });
  return btoa(sessionCookie);
}

function createLegacyCookieValue(metadata: string): string {
  return btoa(metadata);
}
