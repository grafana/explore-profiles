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
import React, { useCallback } from 'react';
import 'react-dom';

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

function useTimeRangePicker(
  pyroscopeTimeRange: TimeRangeType,
  onChangeTimerangePicker: ToolbarProps['onChangeTimeRange']
) {
  const timeRange = translatePyroscopeTimeRangeToGrafana(pyroscopeTimeRange.from, pyroscopeTimeRange.until);

  const setTimeRange = useCallback(
    (newTimeRange: TimeRange) => {
      const { from, until } = translateGrafanaTimeRangeToPyroscope(newTimeRange);
      onChangeTimerangePicker(String(Number(from) * 1000), String(Number(until) * 1000));
    },
    [onChangeTimerangePicker]
  );

  const zoom = useCallback(() => {
    const { from, to } = timeRange;
    const halfDiff = to.diff(from) / 2;

    // These are mutable...
    from.subtract(halfDiff);
    to.add(halfDiff);

    setTimeRange({ from, to, raw: { from, to } });
  }, [timeRange, setTimeRange]);

  const navigate = useCallback(
    (forward = true) => {
      const { from, to } = timeRange;
      const multiplier = forward ? +1 : -1;
      const halfDiff = (to.diff(from) / 2) * multiplier;

      // These are mutable...
      from.add(halfDiff);
      to.add(halfDiff);

      setTimeRange({ from, to, raw: { from, to } });
    },
    [timeRange, setTimeRange]
  );

  return {
    timeRange,
    setTimeRange,
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

  const { services } = useFetchServices(timeRange);

  const onRefreshAll = () => {
    onRefresh();
  };

  const { serviceNameOptions, selectedServiceName, selectServiceName } = useBuildServiceNameOptions(services);
  const { profileTypeOptions, selectedProfileType, selectProfileType } = useBuildProfileTypeOptions(services);

  // TODO: setTimeZone, etc.
  const { setTimeRange, setTimeZone, zoom, navigate } = useTimeRangePicker(timeRange, onChangeTimeRange);

  console.log('*** NEW     ', timeRange);

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
        </InlineFieldRow>
        {/* Time range selection */}
        <HorizontalGroup align="flex-start">
          <TimeRangePicker
            isOnCanvas={true}
            onChange={setTimeRange}
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
