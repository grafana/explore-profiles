import { vcsClient } from '@shared/components/FunctionDetailsPanel/infrastructure/vcsClient';
import { displayError } from '@shared/domain/displayStatus';
import React from 'react';

import { nonce } from '../GitHubContextProvider';
import { GitSessionCookie } from '../infrastructure/GitSessionCookie';
import { gitSessionCookieManager } from '../infrastructure/GitSessionCookieManager';
import { privateVcsClient } from '../infrastructure/PrivateVcsClient';
import { openLoginPopup } from './openLoginPopup';

export async function githubLogin(
  sessionCookie: GitSessionCookie | undefined,
  externalWindow: Window | null | undefined,
  setExternalWindow: React.Dispatch<React.SetStateAction<Window | null | undefined>>
): Promise<void> {
  if (externalWindow) {
    externalWindow.close();
  }

  if (sessionCookie?.isUserTokenExpired()) {
    // A session already exists, but it's expired. Refresh the session.
    try {
      await privateVcsClient.refresh();
      return;
    } catch (e) {
      // This error isn't fatal and we can recover from it by restarting the
      // oauth login flow.
      console.error('failed to refresh GitHub user token', e);

      // Failed to refresh the token. Delete the old token and enter the
      // follow login flow to get a completely new token.
      gitSessionCookieManager.deleteCookie();
    }
  }

  // No session cookie exists, begin the complete login flow.
  try {
    const clientId = await vcsClient.githubApp();
    setExternalWindow(openLoginPopup(clientId, nonce));
  } catch (e) {
    displayError(e, ['Failed to start login flow.', (e as Error).message]);
  }
}
