import { useEffect } from 'react';

import { displaySuccess, displayWarning } from '../shared/domain/displayStatus';

function onOffline() {
  displayWarning(['Your network connection has been lost.']);
}

function onOnline() {
  displaySuccess(['You are now connected to the network.']);
}

export function useOfflineDetection() {
  useEffect(() => {
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });
}
