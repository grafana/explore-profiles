import { config } from '@grafana/runtime';

import { PLUGIN_BASE_URL, ROUTES } from '../../../../../../../../../constants';

function stripTrailingSlash(str: string): string {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

function buildGitHubAuthURL(clientID: string, nonce: string): string {
  const appSubUrl = stripTrailingSlash(config.appSubUrl || '/');
  const redirectUri = `${window.location.origin}${appSubUrl}${PLUGIN_BASE_URL}${ROUTES.GITHUB_CALLBACK}`;

  const url = new URL('/login/oauth/authorize', 'https://github.com');
  url.searchParams.set('client_id', clientID);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set(
    'state',
    btoa(
      JSON.stringify({
        redirect_uri: redirectUri,
        nonce,
      })
    )
  );

  return url.toString();
}

const POPUP_WIDTH = 800;
const POPUP_HEIGHT = 950;

export function openLoginPopup(clientId: string, nonce: string): Window | null {
  const oauthURL = buildGitHubAuthURL(clientId, nonce);

  const { top } = window;
  const x = (top?.outerWidth ?? 0) / 2 + (top?.screenX ?? 0) - POPUP_WIDTH / 2;
  const y = (top?.outerHeight ?? 0) / 2 + (top?.screenY ?? 0) - POPUP_HEIGHT / 2;

  return window.open(
    oauthURL,
    'GitHub Login',
    `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${POPUP_WIDTH}, height=${POPUP_HEIGHT}, top=${y}, left=${x}`
  );
}
