import { GitSessionCookie } from './GitSessionCookie';

const GITHUB_SESSION_COOKIE_NAME = 'GitSession';
const GITHUB_REFRESH_EXPIRY_DURATION = 15897600000;

export interface GitSessionCookieManager {
  getCookie(): GitSessionCookie | undefined;
  setCookie(cookie: string): void;
  deleteCookie(): void;
}

type Cookie = {
  key: string;
  value: string;
};

class InternalGitSessionCookieManager implements GitSessionCookieManager {
  private rawCookie: Cookie | undefined;
  private sessionCookie: GitSessionCookie | undefined;

  getCookie(): GitSessionCookie | undefined {
    // To make sure we're using a cookie that accurately reflects the browser
    // state, let's be paranoid and make sure our cached cookie is accurate.
    this.syncCookieWithBrowser();
    return this.sessionCookie;
  }

  setCookie(cookie: string): void {
    if (!cookie.startsWith(`${GITHUB_SESSION_COOKIE_NAME}=`)) {
      cookie = `${GITHUB_SESSION_COOKIE_NAME}=${cookie}`;
    }

    const rawCookie = InternalGitSessionCookieManager.getCookieFromJar(cookie, GITHUB_SESSION_COOKIE_NAME);
    if (rawCookie === undefined) {
      // If we can't parse the key-value pair out of [cookie], let's return now
      // to avoid corrupting the state of the manager or browser cookie.
      return;
    }

    this.rawCookie = rawCookie;
    this.sessionCookie = GitSessionCookie.decode(rawCookie.value);
    const expiryDate = new Date(Date.now() + GITHUB_REFRESH_EXPIRY_DURATION).toUTCString();
    document.cookie = `${cookie}; Expires=${expiryDate}; Secure; SameSite=Lax; path=/`;
  }

  deleteCookie(): void {
    document.cookie = `${GITHUB_SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    this.rawCookie = undefined;
    this.sessionCookie = undefined;
  }

  private syncCookieWithBrowser(): void {
    const cookie = InternalGitSessionCookieManager.getCookieFromJar(document.cookie, GITHUB_SESSION_COOKIE_NAME);
    if (cookie?.key === this.rawCookie?.key && cookie?.value === this.rawCookie?.value) {
      return;
    }

    cookie !== undefined ? this.setCookie(`${cookie.key}=${cookie.value}`) : this.deleteCookie();
  }

  private static getCookieFromJar(jar: string, name: string): Cookie | undefined {
    return jar
      .split(';')
      .map((ck) => {
        // Just doing split('=') results in the trailing padding to be dropped.
        // While `btoa` seems to handle this case without problem, being
        // pedantic with padding isn't a bad thing. Doing this song and dance
        // allows us to keep the trailing padding.
        const [key, ...rest] = ck.trim().split('=');
        const value = rest.join('=');
        return { key: key.trim(), value: value?.trim() };
      })
      .find(({ key }) => key === name);
  }
}

export const gitSessionCookieManager: GitSessionCookieManager = new InternalGitSessionCookieManager();
