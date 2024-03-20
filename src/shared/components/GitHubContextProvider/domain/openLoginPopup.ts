function buildGitHubAuthURL(clientID: string, nonce: string): string {
  const url = new URL('/login/oauth/authorize', 'https://github.com');

  url.searchParams.set('client_id', clientID);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set(
    'state',
    btoa(
      JSON.stringify({
        redirect_uri: window.location.origin,
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

  return window.open(oauthURL, 'GitHub Login', `width=${POPUP_WIDTH}, height=${POPUP_HEIGHT}, top=${y}, left=${x}`);
}
