import { displayError } from '@shared/domain/displayStatus';
import { useEffect } from 'react';

import { authFromUrl } from './authFromUrl';

type PollGithubPopupParams = {
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
        const searchParms = tryGetWindowSearchParams(externalWindow);

        if (searchParms !== null) {
          const sessionCookie = await authFromUrl(searchParms, nonce);

          if (sessionCookie) {
            setSessionCookie(sessionCookie);
            externalWindow.close();
            setExternalWindow(null);
            return;
          }
        }
      } catch (error) {
        displayError(error, ['Error while login in with GitHub!', (error as Error).message]);
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
  }, [externalWindow, setExternalWindow, setSessionCookie, nonce]);
}