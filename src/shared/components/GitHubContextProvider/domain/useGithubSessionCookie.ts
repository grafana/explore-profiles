import { useState } from 'react';

// The backend expect this cookie for all requests to the VCS service.
const GITHUB_SESSION_COOKIE_NAME = 'GitSession';

function getGitHubSessionCookie() {
  const cookie = document.cookie
    .split(';')
    .map((cookie) => {
      cookie = cookie.trim();
      let [name, value] = cookie.split('=');
      return { name: name.trim(), value: value?.trim() };
    })
    .find(({ name }) => name === GITHUB_SESSION_COOKIE_NAME);

  if (!cookie) {
    return undefined;
  }

  return cookie.value;
}

export function useGithubSessionCookie() {
  const [cookie, setCookie] = useState(getGitHubSessionCookie());

  const setNextCookie = (nextValue: string) => {
    if (!nextValue) {
      document.cookie = `${GITHUB_SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      setCookie('');
      return;
    }

    // we should use a http-only secure cookie but the app plugin backend drops those headers
    // TODO: investigate further how to have a http-only secure cookie
    document.cookie = `${nextValue}; path=/`;
    setCookie(nextValue);
  };

  return [cookie, setNextCookie] as const;
}
