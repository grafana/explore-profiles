import { displayError } from '@shared/domain/displayStatus';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { useCallback, useState } from 'react';

import { adHocProfileClient } from '../infrastructure/adHocProfileClient';

export function useDiffProfile() {
  const [profileTypes, setProfileTypes] = useState<string[]>([]);
  const [profile, setProfile] = useState<FlamebearerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiff = useCallback(async (leftId: string, rightId: string, profileType?: string) => {
    setProfile(null);
    setIsLoading(true);

    try {
      const data = await adHocProfileClient.diff(leftId, rightId, profileType);

      setProfileTypes(data.profileTypes);
      setProfile(data.profile);
    } catch (error) {
      if (!adHocProfileClient.isAbortError(error)) {
        displayError(error as Error, ['Error while computing diff!', (error as Error).message]);
      }
    }

    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setProfileTypes([]);
  }, []);

  return { profileTypes, profile, isLoading, fetchDiff, reset };
}
