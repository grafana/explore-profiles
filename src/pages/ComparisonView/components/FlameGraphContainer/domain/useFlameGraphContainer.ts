import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import {
  FetchTimelineAndProfileTarget,
  useFetchTimelineAndProfile,
} from '@shared/infrastructure/useFetchTimelineAndProfile';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchDiffProfile } from '../infrastructure/useFetchDiffProfile';

export function useFlameGraphContainer(target: string): DomainHookReturnValue {
  const [maxNodes] = useMaxNodesFromUrl();

  const { left, right } = useLeftRightParamsFromUrl();
  const { query, timeRange } = target === 'left-profile' ? left : right;

  const {
    isFetching: isFetchingLeftRightProfile,
    error: fetchLeftRightProfileDataError,
    profile: leftRightProfile,
  } = useFetchTimelineAndProfile({
    disabled: target === 'diff-profile',
    target: target as FetchTimelineAndProfileTarget,
    query,
    timeRange,
    maxNodes,
  });

  const {
    isFetching: isFetchingDiffProfile,
    error: fetchDiffProfileDataError,
    profile: diffProfile,
  } = useFetchDiffProfile({
    disabled: target !== 'diff-profile',
  });

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  // TODO: improve
  const noLeftRightProfileDataAvailable =
    !fetchLeftRightProfileDataError && leftRightProfile?.flamebearer.numTicks === 0;
  const noDiffProfileDataAvailable = !fetchDiffProfileDataError && diffProfile?.flamebearer.numTicks === 0;

  const fetchProfileDataError = fetchLeftRightProfileDataError || fetchDiffProfileDataError;
  const noProfileDataAvailable = noLeftRightProfileDataAvailable || noDiffProfileDataAvailable;
  const profile = leftRightProfile || diffProfile;

  return {
    data: {
      isLoading: isFetchingLeftRightProfile || isFetchingDiffProfile || isFetchingSettings,
      fetchProfileDataError,
      noProfileDataAvailable,
      profile,
      shouldDisplayFlamegraph: Boolean(!fetchProfileDataError && !noProfileDataAvailable && profile),
      fetchSettingsError,
      settings,
    },
    actions: {},
  };
}
