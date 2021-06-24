/**
 * A cool cache for cool people 😎. This cache
 * wraps around API calls and caches the results
 * in localStorage
 *
 * @METEORCITY_CANDIDATE
 * - I don't really like the Promise<T | void> signature.
 *   Maybe come up with some sort of CacheResponse type?
 * - better error handling
 */

/**
 * A function that will be used to fetch a value if it isn't
 * stored in the cache already
 */
type LookerUpper<T> = (lookupVal: string) => T | Promise<T | void>;

export class CoolCache<T> {
  /**
   * This key will be used to identify the resource in localStorage
   */
  private key: string;

  /**
   * This will be used to look up the value if it isn't available
   * in localStorage
   */
  private handler: LookerUpper<T>;

  constructor(key: string, handler: LookerUpper<T>) {
    this.key = key;
    this.handler = handler;
  }

  private mkKey(key: string): string {
    return `${this.key}.${key}`;
  }

  async get(lookupVal: string): Promise<T | void> {
    const key = this.mkKey(lookupVal);
    const localVal = localStorage.getItem(key);
    if (localVal) {
      const parsed = JSON.parse(localVal) as T;
      return parsed;
    }
    const res = await this.handler(lookupVal);
    if (res) {
      localStorage.setItem(key, JSON.stringify(res));
      return res;
    }
  }
}
