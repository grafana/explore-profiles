import React, { useCallback, useContext, useMemo } from 'react';
import 'react-dom';

import { useAppSelector, useAppDispatch } from '@pyroscope/redux/hooks';
import { Query } from '@pyroscope/models/query';
import {
  reloadAppNames,
  selectContinuousState,
  actions,
  selectTimelineSides,
  selectComparisonState,
} from '@pyroscope/redux/reducers/continuous';
import {
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  RefreshPicker,
  Select,
  TimeRangePicker,
  useStyles2,
} from '@grafana/ui';
import { GrafanaTheme2, SelectableValue, TimeRange } from '@grafana/data';
import { css } from '@emotion/css';
import { isLoadingOrReloading } from '@pyroscope/pages/loading';
import { PyroscopeStateContext } from '../../components/PyroscopeState/context';
import userStorage from '../../utils/UserStorage';
import { ProfileMetricId, useGetProfileMetricByIds } from './TagsBar/QueryInput/hooks/useProfileMetricsQuery';

interface ToolbarProps {
  /** callback to be called when an app is selected via the dropdown */
  onSelectedApp: (name: Query) => void; // We don't use this. Instead we allow the PyroscopeStateContext to handle state changes.
  filterApp?: (names: string) => boolean;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    profileName: css`
      color: ${theme.colors.text.maxContrast};
      font-weight: bolder;
    `,
    toolbar: css`
      //background: ${theme.colors.background.primary};
      //border: 1px solid ${theme.colors.border.medium};
      margin-bottom: ${theme.spacing(1)};
      //padding-top: 2px;
    `,
    refresher: css`
      min-width: ${theme.spacing(5)};
    `,
  };
};

function useBuildProfileTypeOptions() {
  const styles: ReturnType<typeof getStyles> = useStyles2(getStyles);
  const { profileTypes, selectedProfileType, setSelectedProfileType } = useContext(PyroscopeStateContext);

  const { data: profileMetrics } = useGetProfileMetricByIds(profileTypes as ProfileMetricId[]);

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(
    () =>
      profileMetrics.map((profileMetric) => ({
        value: profileMetric.id,
        // The underlying mechanism used by Grafana's <Select> accepts components for labels,
        // but the strict typing believes that it only accepts strings, so we lie about the type here.
        label: (
          <span className={styles.profileName}>
            {profileMetric.type} ({profileMetric.group})
          </span>
        ) as unknown as string,
        imgUrl: 'public/plugins/grafana-pyroscope-app/img/logo.svg',
      })),
    [profileMetrics, styles]
  );

  return {
    profileTypeOptions,
    selectedProfileType,
    selectProfileType(selection: SelectableValue<string>) {
      setSelectedProfileType(selection.value || '');
    },
  };
}

function useBuildServiceNameOptions() {
  const { serviceNames, selectedServiceName, setSelectedServiceName } = useContext(PyroscopeStateContext);

  const serviceNameOptions: Array<SelectableValue<string>> = useMemo(
    () =>
      serviceNames.map((name) => ({
        value: name,
        label: name,
        icon: 'sitemap',
      })),
    [serviceNames]
  );

  return {
    serviceNameOptions,
    selectedServiceName,
    selectServiceName(selection: SelectableValue<string>) {
      const serviceName = selection.value || '';

      setSelectedServiceName(serviceName);

      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: serviceName }).catch(() => {}); // fire & forget
    },
  };
}

function useRefreshAppsPicker() {
  const { appsLoading } = useContext(PyroscopeStateContext);
  const dispatch = useAppDispatch();

  return {
    appsLoading,
    refreshApps() {
      dispatch(reloadAppNames());
    },
  };
}

function useTimeRangePicker() {
  const { timeRange, setTimeRange } = useContext(PyroscopeStateContext);

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
    setTimeRange(newRange);
  }, [timeRange, setTimeRange]);

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
      setTimeRange(newRange);
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

function useResultsLoadingCheck() {
  const timelineSides = useAppSelector(selectTimelineSides);
  const timelinesState = useAppSelector(selectContinuousState);
  const { left: comparisonLeft, right: comparisonRight } = useAppSelector(selectComparisonState);
  const { diffView, tagExplorerView } = useAppSelector(selectContinuousState);

  const { singleView } = useAppSelector((state) => state.continuous);

  const isLoading = isLoadingOrReloading([
    comparisonLeft.type,
    comparisonRight.type,
    timelineSides.left.type,
    timelineSides.right.type,
    timelinesState.leftTimeline.type,
    timelinesState.rightTimeline.type,
    diffView.type,
    singleView.type,
    tagExplorerView.activeTagProfileLoadingType,
    tagExplorerView.groupsLoadingType,
  ]);

  return isLoading;
}

function useRefreshTimeRangePicker() {
  const dispatch = useAppDispatch();

  const isDataLoading = useResultsLoadingCheck();

  return {
    isDataLoading,
    refreshData() {
      dispatch(actions.refresh());
    },
  };
}

export default function Toolbar({}: ToolbarProps) {
  const styles = useStyles2(getStyles);

  /** Create drop-down selector options */

  const { serviceNameOptions, selectedServiceName, selectServiceName } = useBuildServiceNameOptions();
  const { profileTypeOptions, selectedProfileType, selectProfileType } = useBuildProfileTypeOptions();

  const { timeRange, setTimeRange, setTimeZone, zoom, navigate } = useTimeRangePicker();

  /** Refresh functionality */

  const { appsLoading, refreshApps } = useRefreshAppsPicker();
  const { isDataLoading, refreshData } = useRefreshTimeRangePicker();

  /** Component */
  return (
    <div className={styles.toolbar}>
      <HorizontalGroup justify="space-between">
        {/* App Selection */}
        <InlineFieldRow>
          <InlineField label="Service">
            <Select<string> value={selectedServiceName} options={serviceNameOptions} onChange={selectServiceName} />
          </InlineField>
          <InlineField label="Profile">
            <Select<string> value={selectedProfileType} options={profileTypeOptions} onChange={selectProfileType} />
          </InlineField>
          <RefreshPicker
            isOnCanvas={true}
            noIntervalPicker={true}
            onRefresh={refreshApps}
            onIntervalChanged={() => null}
            isLoading={appsLoading}
            text={appsLoading ? 'Refreshing names' : undefined}
          />
        </InlineFieldRow>
        {/* Time range selection */}
        <HorizontalGroup>
          <TimeRangePicker
            isOnCanvas={true}
            onChange={setTimeRange}
            onChangeTimeZone={setTimeZone}
            value={timeRange}
            onZoom={zoom}
            onMoveBackward={() => navigate(false)}
            onMoveForward={() => navigate(true)}
          />
          <div className={styles.refresher}>
            <RefreshPicker
              isOnCanvas={true}
              noIntervalPicker={true}
              onRefresh={refreshData}
              onIntervalChanged={() => null}
              isLoading={isDataLoading}
            />
          </div>
        </HorizontalGroup>
      </HorizontalGroup>
    </div>
  );
}
