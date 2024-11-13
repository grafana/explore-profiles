import { displayError } from '@shared/domain/displayStatus';
import { useEffect } from 'react';

import { VcsClient } from '../../../infrastructure/VcsClient';
import { authFromUrl } from './authFromUrl';

type PollGithubPopupParams = {
  vcsClient: VcsClient;
  externalWindow: Window | null | undefined;
  setExternalWindow: (window: Window | null) => void;
  setSessionCookie: (sessionCookie: string) => void;
  nonce: string;
};

function tryGetWindowSearchParams(window: Window): URLSearchParams | null {
  try {
    return new URL(window.location.href).searchParams;
  } catch {
    return null;
  }
}

export function usePollGitHubPopup({
  vcsClient,
  externalWindow,
  setExternalWindow,
  setSessionCookie,
  nonce,
}: PollGithubPopupParams) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const checkPopup = async () => {
      if (!externalWindow || externalWindow.closed) {
        setExternalWindow(null);
        return;
      }

      try {
        const searchParams = tryGetWindowSearchParams(externalWindow);

        if (searchParams !== null) {
          const sessionCookie = await authFromUrl(vcsClient, searchParams, nonce);

          if (sessionCookie) {
            setSessionCookie(sessionCookie);
            externalWindow.close();
            setExternalWindow(null);
            return;
          }
        }
      } catch (error) {
        displayError(error as Error, ['Error while login in with GitHub!', (error as Error).message]);
        externalWindow.close();
        setExternalWindow(null);
        return;
      }

      // keep checking for the popup to close
      window.setTimeout(checkPopup, 700);
    };

    if (externalWindow) {
      checkPopup();
    }

    return () => {
      if (externalWindow) {
        externalWindow.close();
        setExternalWindow(null);
      }
    };
  }, [externalWindow, setExternalWindow, setSessionCookie, nonce, vcsClient]);
}
