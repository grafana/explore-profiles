import { SelectableValue } from '@grafana/data';
import { displayError } from '@shared/domain/displayStatus';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createAdHocProfileClient } from '../infrastructure/adHocProfileClient';
import { AdHocProfile } from './AdHocProfile';

const DEFAULT_PROFILE_DATA: AdHocProfile = {
  id: '',
  name: '',
  profileTypes: [],
  profile: null,
};

export function useUploadFile() {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE_DATA);
  const client = useMemo(() => createAdHocProfileClient(), []);

  useEffect(() => {
    return () => {
      client.abort();
    };
  }, [client]);

  const removeFile = useCallback(() => {
    client.abort();

    setIsLoading(false);
    setProfileData(DEFAULT_PROFILE_DATA);
  }, [client]);

  const processFile = useCallback(
    async (file: File) => {
      removeFile();

      try {
        setIsLoading(true);

        const data = await client.uploadSingle(file);

        setProfileData(data);
      } catch (error) {
        setProfileData(DEFAULT_PROFILE_DATA);

        if (!client.isAbortError(error)) {
          displayError(error as Error, ['Error while uploading profile!', (error as Error).message]);
        }
      }

      setIsLoading(false);
    },
    [client, removeFile]
  );

  const selectProfileType = useCallback(
    async (option: SelectableValue<string>) => {
      const profileType = option.value;

      if (!profileType || !profileData.id || !profileData.profileTypes.includes(profileType)) {
        return;
      }

      client.abort();
      setIsLoading(false);
      setProfileData((prevData) => ({ ...prevData, profile: null }));

      setIsLoading(true);

      try {
        const data = await client.get(profileData.id, profileType);

        setProfileData((prevData) => ({
          ...prevData,
          profile: data.profile,
        }));
      } catch (error) {
        if (!client.isAbortError(error)) {
          displayError(error as Error, ['Error while fetching profile!', (error as Error).message]);
        }
      }

      setIsLoading(false);
    },
    [client, profileData.id, profileData.profileTypes]
  );

  return {
    id: profileData.id,
    processFile,
    profileTypes: profileData.profileTypes,
    selectProfileType,
    profile: profileData.profile,
    removeFile,
    isLoading,
  };
}
