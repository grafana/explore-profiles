import { noOp } from '@shared/domain/noOp';

import { useFetchServices } from '../../../infrastructure/services/useFetchServices';
import { useTimeRangePicker } from '../ui/useTimeRangePicker';
import { useBuildProfileTypeOptions } from './useBuildProfileTypeOptions';
import { useBuildServiceNameOptions } from './useBuildServiceNameOptions';

export function useToolbar() {
  const { timeRange, setTimeRange, zoom, navigate } = useTimeRangePicker();

  const { services } = useFetchServices({ timeRange });

  const { serviceOptions, selectedService, setService } = useBuildServiceNameOptions(services);
  const { profileTypeOptions, selectedProfileType, setProfileType } = useBuildProfileTypeOptions(services);

  return {
    data: {
      servicePlaceHolder: `Choose a service (${serviceOptions.length})`,
      serviceOptions,
      selectedService,
      profileTypePlaceHolder: `Choose a profile type (${profileTypeOptions.length})`,
      profileTypeOptions,
      selectedProfileType,
      timeRange,
    },
    actions: {
      setService,
      setProfileType,
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
    },
  };
}
