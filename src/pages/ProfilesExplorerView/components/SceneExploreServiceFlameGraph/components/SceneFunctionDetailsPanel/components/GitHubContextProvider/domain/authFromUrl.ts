import { VcsClient } from '../../../infrastructure/VcsClient';

export async function authFromUrl(
  vcsClient: VcsClient,
  urlSearchParams: URLSearchParams,
  nonce: string
): Promise<string> {
  const code = urlSearchParams.get('code');
  if (!code) {
    return '';
  }

  const stateValue = urlSearchParams.get('state');
  if (!stateValue) {
    throw new Error('Invalid state parameter!');
  }

  let state;

  try {
    state = JSON.parse(atob(stateValue));
  } catch (error) {
    throw new Error('Invalid state parameter!');
  }

  if (state.nonce !== nonce) {
    throw new Error('Invalid nonce parameter!');
  }

  const res = await vcsClient.githubLogin(code);
  return res.cookie;
}
