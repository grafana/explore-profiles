import { displayError } from '@shared/domain/displayStatus';
import { logger } from '@shared/infrastructure/tracking/logger';
import React from 'react';

import { VcsClient } from '../../../infrastructure/VcsClient';
import { PrivateVcsClient } from '../../GitHubContextProvider/infrastructure/PrivateVcsClient';
import { nonce } from '../GitHubContextProvider';
import { GitSessionCookie } from '../infrastructure/GitSessionCookie';
import { gitSessionCookieManager } from '../infrastructure/GitSessionCookieManager';
import { openLoginPopup } from './openLoginPopup';

export async function githubLogin(
  vcsClient: VcsClient,
  privateVcsClient: PrivateVcsClient,
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
    } catch (error) {
      // This error isn't fatal and we can recover from it by restarting the
      // oauth login flow.
      logger.error(error as Error, { info: 'Failed to refresh GitHub user token' });

      // Failed to refresh the token. Delete the old token and enter the
      // follow login flow to get a completely new token.
      gitSessionCookieManager.deleteCookie();
    }
  }

  // No session cookie exists, begin the complete login flow.
  try {
    const { clientID: clientId, callbackURL: callbackUrl } = await vcsClient.githubApp();
    setExternalWindow(openLoginPopup(clientId, nonce, callbackUrl));
  } catch (error) {
    displayError(error as Error, ['Failed to start login flow.', (error as Error).message]);
  }
}
