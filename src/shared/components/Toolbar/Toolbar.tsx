import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import {
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  RefreshPicker,
  Select,
  TimeRangePicker,
  useStyles2,
} from '@grafana/ui';
import React, { useCallback, useContext } from 'react';
import 'react-dom';

import { PyroscopeStateContext } from '../../../app/domain/PyroscopeState/context';
import { translateGrafanaTimeRangeToPyroscope, translatePyroscopeTimeRangeToGrafana } from '../../domain/translation';
import { TimeRange as TimeRangeType } from '../../types/TimeRange';
import { useFetchServices } from './infrastructure/useFetchServices';
import { useBuildProfileTypeOptions } from './ui/useBuildProfileTypeOptions';
import { useBuildServiceNameOptions } from './ui/useBuildServiceNameOptions';

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    toolbar: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

function useTimeRangePicker(refreshServices: Function) {
  const { timeRange, setTimeRange: setPyroscopeTimeRange } = useContext(PyroscopeStateContext);

  const zoom = useCallback(() => {
    // Zooming out will double the overall range.
    if (!timeRange) {
      return;
    }
    const { from, to } = timeRange;

    const halfDiff = to.diff(from) / 2;

    // These are mutable...
    from.subtract(halfDiff);
    to.add(halfDiff);

    const newRange: TimeRange = {
      raw: {
        from,
        to,
      },
      from,
      to,
    };

    setPyroscopeTimeRange(newRange);
    // TODO: refreshApps() as well?
  }, [timeRange, setPyroscopeTimeRange]);

  const navigate = useCallback(
    (forward = true) => {
      const { from, to } = timeRange;

      const multiplier = forward ? +1 : -1;

      const halfDiff = (to.diff(from) / 2) * multiplier;

      // These are mutable...
      from.add(halfDiff);
      to.add(halfDiff);

      const newRange: TimeRange = {
        raw: {
          from,
          to,
        },
        from,
        to,
      };

      setPyroscopeTimeRange(newRange);
      // TODO: refreshApps() as well?
    },
    [timeRange, setPyroscopeTimeRange]
  );

  return {
    timeRange,
    setTimeRange: (newRange: TimeRange) => {
      setPyroscopeTimeRange(newRange);
      refreshServices();
    },
    setTimeZone() {}, // no op
    zoom,
    navigate,
  };
}

type ToolbarProps = {
  isLoading: boolean;
  timeRange: TimeRangeType;
  onRefresh: () => void;
  onChangeTimeRange: (from: string, until: string) => void;
};

export function Toolbar({ isLoading, timeRange, onRefresh, onChangeTimeRange }: ToolbarProps) {
  const styles = useStyles2(getStyles);

  const { isFetching: isLoadingServices, services, refetch: refetchServices } = useFetchServices(timeRange);

  const onRefreshAll = () => {
    refetchServices();
    onRefresh();
  };

  const { serviceNameOptions, selectedServiceName, selectServiceName } = useBuildServiceNameOptions(services);
  const { profileTypeOptions, selectedProfileType, selectProfileType } = useBuildProfileTypeOptions(services);

  // TODO: setTimeZone, etc.
  const { setTimeZone, zoom, navigate } = useTimeRangePicker(refetchServices);

  const onChangeTimerangePicker = (newTimeRange: TimeRange) => {
    const { from, until } = translateGrafanaTimeRangeToPyroscope(newTimeRange);
    onChangeTimeRange(from, until);
  };

  return (
    <div className={styles.toolbar}>
      <HorizontalGroup justify="space-between" align="flex-start">
        <InlineFieldRow>
          <InlineField label="Service">
            <Select<string>
              value={selectedServiceName}
              options={serviceNameOptions}
              onChange={selectServiceName}
              aria-label="Services list"
            />
          </InlineField>
          <InlineField label="Profile">
            <Select<string>
              value={selectedProfileType}
              options={profileTypeOptions}
              onChange={selectProfileType}
              aria-label="Profiles list"
            />
          </InlineField>
          <RefreshPicker
            isOnCanvas={true}
            noIntervalPicker={true}
            onRefresh={refetchServices}
            onIntervalChanged={() => null}
            isLoading={isLoadingServices}
            width="36px"
          />
        </InlineFieldRow>
        {/* Time range selection */}
        <HorizontalGroup align="flex-start">
          <TimeRangePicker
            isOnCanvas={true}
            onChange={onChangeTimerangePicker}
            // TODO: setTimeZone
            onChangeTimeZone={setTimeZone}
            value={translatePyroscopeTimeRangeToGrafana(timeRange.from, timeRange.until)}
            onZoom={zoom}
            onMoveBackward={() => navigate(false)}
            onMoveForward={() => navigate(true)}
          />
          <RefreshPicker
            isOnCanvas={true}
            noIntervalPicker={true}
            onRefresh={onRefreshAll}
            onIntervalChanged={() => null}
            isLoading={isLoading}
            width="36px"
          />
        </HorizontalGroup>
      </HorizontalGroup>
    </div>
  );
}
