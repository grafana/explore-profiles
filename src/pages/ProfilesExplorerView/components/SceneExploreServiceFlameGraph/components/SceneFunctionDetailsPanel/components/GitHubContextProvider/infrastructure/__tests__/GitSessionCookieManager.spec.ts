import { GitSessionCookie } from '../GitSessionCookie';
import { GitSessionCookieManager } from '../GitSessionCookieManager';

const MAX_UNIX_TS_MS = 8640000000000000;

describe('GitSessionCookieManager', () => {
  let manager: GitSessionCookieManager;
  beforeEach(() => {
    deleteAllCookies();
    const { gitSessionCookieManager } = require('../GitSessionCookieManager');
    manager = gitSessionCookieManager;
  });

  it('can read and cache a cookie from the browser', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    document.cookie = createCookie(metadata, expiry);

    const cookie1 = manager.getCookie();
    expect(cookie1).toEqual(new GitSessionCookie(metadata, expiry));

    const cookie2 = manager.getCookie();
    expect(cookie2).toStrictEqual(cookie1);
  });

  it('can read and cache a namespaced cookie from the browser', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    document.cookie = createNamespacedCookie(metadata, expiry);

    const cookie1 = manager.getCookie();
    expect(cookie1).toEqual(new GitSessionCookie(metadata, expiry));

    const cookie2 = manager.getCookie();
    expect(cookie2).toStrictEqual(cookie1);
  });

  it('can read a legacy cookie', () => {
    const metadata = btoa('some encrypted secret');
    const newCookie = createLegacyCookie(metadata);
    document.cookie = newCookie;

    const cookie1 = manager.getCookie();
    expect(cookie1).toEqual(new GitSessionCookie(metadata, MAX_UNIX_TS_MS));

    const cookie2 = manager.getCookie();
    expect(cookie2).toStrictEqual(cookie1);
  });

  it('can set a cookie', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    const newCookie = createCookie(metadata, expiry);

    const cookie1 = manager.getCookie();
    expect(cookie1).toBeUndefined();

    manager.setCookie(newCookie);
    const cookie2 = manager.getCookie();
    expect(cookie2).toEqual(new GitSessionCookie(metadata, expiry));
    expect(document.cookie).toEqual(newCookie);
  });

  it('can set a namespaced cookie', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    const newCookie = createNamespacedCookie(metadata, expiry);

    const cookie1 = manager.getCookie();
    expect(cookie1).toBeUndefined();

    manager.setCookie(newCookie);
    const cookie2 = manager.getCookie();
    expect(cookie2).toEqual(new GitSessionCookie(metadata, expiry));
    expect(document.cookie).toEqual(newCookie);
  });

  it('can set a cookie without the "GitSession" key', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    const newCookie = createCookie(metadata, expiry);
    const newCookieValue = newCookie.replace(/^GitSession=/, '');

    const cookie1 = manager.getCookie();
    expect(cookie1).toBeUndefined();

    manager.setCookie(newCookieValue);
    const cookie2 = manager.getCookie();
    expect(cookie2).toEqual(new GitSessionCookie(metadata, expiry));
    expect(document.cookie).toEqual(newCookie);
  });

  it('can set a legacy cookie', () => {
    const metadata = btoa('some encrypted secret');
    const newCookie = createLegacyCookie(metadata);

    const cookie1 = manager.getCookie();
    expect(cookie1).toBeUndefined();

    manager.setCookie(newCookie);
    const cookie2 = manager.getCookie();
    expect(cookie2).toEqual(new GitSessionCookie(metadata, MAX_UNIX_TS_MS));
    expect(document.cookie).toEqual(newCookie);
  });

  it('can delete a "GitSession" cookie', () => {
    const metadata = btoa('some encrypted secret');
    const expiry = 1712762580000;
    document.cookie = createCookie(metadata, expiry);

    manager.deleteCookie();
    const cookie = manager.getCookie();
    expect(cookie).toBeUndefined();
    expect(document.cookie).toEqual('');
  });

  it('can delete a "GitSession" cookie that does not exist', () => {
    expect(document.cookie).toEqual('');

    manager.deleteCookie();
    const cookie = manager.getCookie();
    expect(cookie).toBeUndefined();
    expect(document.cookie).toEqual('');
  });
});

// Copied from: https://stackoverflow.com/questions/179355/clearing-all-cookies-with-javascript/179514#179514
function deleteAllCookies() {
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

function createCookie(metadata: string, expiry: number): string {
  const sessionCookie = JSON.stringify({
    metadata: metadata,
    expiry: expiry,
  });
  const encoded = btoa(sessionCookie);
  return `GitSession=${encoded}`;
}

function createLegacyCookie(metadata: string): string {
  return `GitSession=${metadata}`;
}

function createNamespacedCookie(metadata: string, expiry: number): string {
  const sessionCookie = JSON.stringify({
    metadata: metadata,
    expiry: expiry,
  });
  const encoded = btoa(sessionCookie);
  return `pyroscope_git_session=${encoded}`;
}
