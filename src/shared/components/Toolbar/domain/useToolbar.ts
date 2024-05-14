import { SelectableValue, TimeRange } from '@grafana/data';
import { noOp } from '@shared/domain/noOp';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchServices } from '../../../infrastructure/services/useFetchServices';
import { ToolbarProps } from '../Toolbar';
import { useBuildProfileTypeOptions } from './useBuildProfileTypeOptions';
import { useBuildServiceNameOptions } from './useBuildServiceNameOptions';

const zoom = (timeRange: TimeRange): TimeRange => {
  const { from, to } = timeRange;
  const halfDiff = to.diff(from) / 2;

  // These are mutable...
  from.subtract(halfDiff);
  to.add(halfDiff);

  return { from, to, raw: { from, to } };
};

const navigate = (timeRange: TimeRange, forward = true): TimeRange => {
  const { from, to } = timeRange;
  const multiplier = forward ? +1 : -1;
  const halfDiff = (to.diff(from) / 2) * multiplier;

  // These are mutable...
  from.add(halfDiff);
  to.add(halfDiff);

  return { from, to, raw: { from, to } };
};

export function useToolbar({
  isLoading,
  onRefresh,
  onChangeTimeRange,
  onChangeService,
  onChangeProfileType,
}: ToolbarProps): DomainHookReturnValue {
  const [timeRange] = useTimeRangeFromUrl();

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
      selectService(newServiceId: string) {
        selectService(newServiceId);
        onChangeService?.(newServiceId);
      },
      selectProfile(option: SelectableValue<string>) {
        const newProfileMetricId = option.value || '';

        selectProfile(newProfileMetricId);
        onChangeProfileType?.(newProfileMetricId);
      },
      setTimeZone: noOp,
      setTimeRange: onChangeTimeRange,
      zoom() {
        onChangeTimeRange(zoom(timeRange));
      },
      moveTimeRangeBackward() {
        onChangeTimeRange(navigate(timeRange, false));
      },
      moveTimeRangeForward() {
        onChangeTimeRange(navigate(timeRange, true));
      },
      setInterval: noOp,
      refresh: onRefresh,
    },
  };
}
