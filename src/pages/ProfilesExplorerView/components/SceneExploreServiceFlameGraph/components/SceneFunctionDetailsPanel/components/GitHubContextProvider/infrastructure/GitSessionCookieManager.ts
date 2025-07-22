import { GitSessionCookie } from './GitSessionCookie';

const LEGACY_GITHUB_SESSION_COOKIE_NAME = 'GitSession';
const GITHUB_SESSION_COOKIE_NAME = 'pyroscope_git_session';

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
  private sessionCookie: GitSessionCookie | undefined;

  constructor() {
    const cookie = InternalGitSessionCookieManager.getCookieFromJar(document.cookie, GITHUB_SESSION_COOKIE_NAME);

    if (cookie) {
      this.sessionCookie = GitSessionCookie.decode(cookie.value);
    }
  }

  getCookie(): GitSessionCookie | undefined {
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

    this.deleteLegacyCookie();
    this.sessionCookie = GitSessionCookie.decode(rawCookie.value);
    document.cookie = `${cookie}; path=/`;
  }

  deleteCookie(): void {
    document.cookie = `${GITHUB_SESSION_COOKIE_NAME}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    this.deleteLegacyCookie();
    this.sessionCookie = undefined;
  }

  private deleteLegacyCookie(): void {
    document.cookie = `${LEGACY_GITHUB_SESSION_COOKIE_NAME}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
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
