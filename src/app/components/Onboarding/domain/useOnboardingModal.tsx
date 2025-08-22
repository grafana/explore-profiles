import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useFetchInstances } from '../infrastructure/useFetchInstances';

export function useOnboardingModal(): DomainHookReturnValue {
  const [settingsUrl, setSettingsUrl] = useState('https://grafana.com/auth/sign-in/');

  const isCloud = /\.grafana(-dev|-ops)?\.net$/.test(window.location.host);
  const { instances } = useFetchInstances(isCloud);

  if (instances && instances.orgSlug && instances.hpInstanceId) {
    const newSettingsUrl = `https://grafana.com/orgs/${instances.orgSlug}/hosted-profiles/${instances.hpInstanceId}`;

    if (settingsUrl !== newSettingsUrl) {
      setSettingsUrl(newSettingsUrl);
    }
  }

  return {
    data: {
      settingsUrl,
      isCloud,
    },
    actions: {},
  };
}
