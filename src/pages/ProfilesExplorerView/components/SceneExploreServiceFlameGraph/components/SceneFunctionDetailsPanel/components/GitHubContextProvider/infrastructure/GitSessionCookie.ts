import { logger } from '@shared/infrastructure/tracking/logger';

/** The maximum Unix ms timestamp that can be stored in a JS Date object. */
const MAX_UNIX_TS_MS = 8640000000000000;

/**
 * This is a value class representing a GitSession cookie value in the browser.
 * It provides APIs to decode a GitSession cookie value and to check if the the
 * underlying user token is expired.
 */
export class GitSessionCookie {
  private readonly oauthTokenMetadata: string;
  private readonly expiry: Date;

  constructor(metadata: string, expiry: number) {
    this.oauthTokenMetadata = metadata;
    this.expiry = new Date(expiry);
  }

  /**
   * Checks if the session cookie is expired. If the optional `biasMs` is
   * provided, then the expiry is biased to expire sooner by `biasMs`
   * milliseconds.
   *
   * @param biasMs Offset in milliseconds
   * @returns True if the session cookie is expired.
   */
  isUserTokenExpired(biasMs = 0): boolean {
    return Date.now() >= this.expiry.getTime() - biasMs;
  }

  /**
   * Decodes the base64 encoded value portion of a session cookie.
   *
   * @param value The value portion of a session cookie
   * @returns A valid `GitSessionCookie` if the string can be decoded, otherwise
   * undefined.
   */
  static decode(value: string | undefined): GitSessionCookie | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    let decoded;
    try {
      decoded = atob(value);
    } catch (error) {
      logger.error(error as Error, { info: 'Failed to base64 decode GitSession value' });
      return undefined;
    }

    const { payload, isLegacy } = GitSessionCookie.tryDecode(decoded);
    if (isLegacy) {
      // This is a legacy cookie value, which does not expose a plaintext
      // expiry. The expiry is set to a maximum date value and we rely on a 401
      // response from the server to indicate expiration.
      return new GitSessionCookie(value, MAX_UNIX_TS_MS);
    }

    return new GitSessionCookie(payload.metadata, Number(payload.expiry));
  }

  /**
   * Attempts to decode the plaintext value portion of a session cookie.
   *
   * @param input Plaintext representation of a session cookie value
   * @returns The payload of the session cookie if it's not a legacy cookie. If
   * it is a legacy cookie, isLegacy is set to true.
   */
  private static tryDecode(input: string): { payload: any; isLegacy: boolean } {
    try {
      const payload = JSON.parse(input);
      return { payload, isLegacy: false };
    } catch {
      return { payload: undefined, isLegacy: true };
    }
  }
}
