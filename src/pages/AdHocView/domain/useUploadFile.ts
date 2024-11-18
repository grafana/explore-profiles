import { SelectableValue } from '@grafana/data';
import { displayError } from '@shared/domain/displayStatus';
import { useCallback, useEffect, useState } from 'react';

import { adHocProfileClient } from '../infrastructure/adHocProfileClient';
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

  useEffect(() => {
    return () => {
      adHocProfileClient.abort();
    };
  }, []);

  const removeFile = useCallback(() => {
    adHocProfileClient.abort();

    setIsLoading(false);
    setProfileData(DEFAULT_PROFILE_DATA);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      removeFile();

      try {
        setIsLoading(true);

        const data = await adHocProfileClient.uploadSingle(file);

        setProfileData(data);
      } catch (error) {
        setProfileData(DEFAULT_PROFILE_DATA);

        if (!adHocProfileClient.isAbortError(error)) {
          displayError(error as Error, ['Error while uploading profile!', (error as Error).message]);
        }
      }

      setIsLoading(false);
    },
    [removeFile]
  );

  const removeProfile = () => {
    adHocProfileClient.abort();

    setIsLoading(false);
    setProfileData((prevData) => ({ ...prevData, profile: null }));
  };

  const selectProfileType = useCallback(
    async (option: SelectableValue<string>) => {
      const profileType = option.value;

      if (!profileType || !profileData.id || !profileData.profileTypes.includes(profileType)) {
        return;
      }

      removeProfile();

      setIsLoading(true);

      try {
        const data = await adHocProfileClient.get(profileData.id, profileType);

        setProfileData((prevData) => ({
          ...prevData,
          profile: data.profile,
        }));
      } catch (error) {
        if (!adHocProfileClient.isAbortError(error)) {
          displayError(error as Error, ['Error while fetching profile!', (error as Error).message]);
        }
      }

      setIsLoading(false);
    },
    [profileData.id, profileData.profileTypes]
  );

  return {
    processFile,
    profileTypes: profileData.profileTypes,
    selectProfileType,
    profile: profileData.profile,
    removeFile,
    isLoading,
  };
}
