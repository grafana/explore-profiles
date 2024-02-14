import { noOp } from '@shared/domain/noOp';

import { useFetchServices } from '../../../infrastructure/services/useFetchServices';
import { useTimeRangePicker } from '../ui/useTimeRangePicker';
import { useBuildProfileTypeOptions } from './useBuildProfileTypeOptions';
import { useBuildServiceNameOptions } from './useBuildServiceNameOptions';

export function useToolbar({ isLoading, onRefresh }: { isLoading: boolean; onRefresh: () => void }) {
  const { timeRange, setTimeRange, zoom, navigate } = useTimeRangePicker();

  const { services } = useFetchServices({ timeRange });

  const { serviceOptions, selectedServiceId, selectService } = useBuildServiceNameOptions(services);
  const { profileOptions, selectedProfileId, selectProfile } = useBuildProfileTypeOptions(services);

  return {
    data: {
      servicePlaceHolder: `Choose a service (${serviceOptions.length})`,
      serviceOptions,
      selectedServiceId,
      profilePlaceHolder: `Choose a profile type (${profileOptions.length})`,
      profileOptions,
      selectedProfileId,
      timeRange,
      isLoading,
    },
    actions: {
      selectService,
      selectProfile,
      setTimeRange,
      setTimeZone: noOp,
      zoom,
      moveTimeRangeBackward() {
        navigate(false);
      },
      moveTimeRangeForward() {
        navigate(true);
      },
      setInterval: noOp,
      refresh() {
        onRefresh();
      },
    },
  };
}
