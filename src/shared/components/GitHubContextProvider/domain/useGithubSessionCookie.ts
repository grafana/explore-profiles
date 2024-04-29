import { useState } from 'react';

import { gitSessionCookieManager } from '../infrastructure/GitSessionCookieManager';

export function useGithubSessionCookie() {
  const [cookie, setCookie] = useState(gitSessionCookieManager.getCookie());

  const setNextCookie = (nextValue: string) => {
    if (!nextValue) {
      gitSessionCookieManager.deleteCookie();
      setCookie(undefined);
    } else {
      gitSessionCookieManager.setCookie(nextValue);
      setCookie(gitSessionCookieManager.getCookie());
    }
  };

  return [cookie, setNextCookie] as const;
}
