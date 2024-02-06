import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue, TimeRange } from '@grafana/data';
import {
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  RefreshPicker,
  Select,
  TimeRangePicker,
  useStyles2,
} from '@grafana/ui';
import { Query } from '@pyroscope/models/query';
import { isLoadingOrReloading } from '@pyroscope/pages/loading';
import { useAppDispatch, useAppSelector } from '@pyroscope/redux/hooks';
import {
  actions,
  reloadAppNames,
  selectComparisonState,
  selectContinuousState,
  selectTimelineSides,
} from '@pyroscope/redux/reducers/continuous';
import React, { useCallback, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { PyroscopeStateContext } from '../../app/domain/PyroscopeState/context';
import { ProfileMetricId } from '../../shared/infrastructure/profile-metrics/getProfileMetric';
import { useGetProfileMetricByIds } from '../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { userStorage } from '../../shared/infrastructure/userStorage';

interface ToolbarProps {
  /** callback to be called when an app is selected via the dropdown */
  onSelectedApp?: (name: Query) => void; // We don't use this. Instead we allow the PyroscopeStateContext to handle state changes.
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

function useTimeRangePicker(refreshApps: Function) {
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
      refreshApps();
    },
    setTimeZone() {}, // no op
    zoom,
    navigate,
  };
}

function useIsDataLoadingPerPage() {
  const timelineSides = useAppSelector(selectTimelineSides);
  const { tagExplorerView, singleView, diffView, leftTimeline, rightTimeline } = useAppSelector(selectContinuousState);
  const { left: comparisonLeft, right: comparisonRight } = useAppSelector(selectComparisonState);

  const { pathname } = useLocation();

  if (pathname.endsWith('tag-explorer')) {
    return isLoadingOrReloading([tagExplorerView.activeTagProfileLoadingType, tagExplorerView.groupsLoadingType]);
  }

  if (pathname.endsWith('single')) {
    return isLoadingOrReloading([singleView.type]);
  }

  if (pathname.endsWith('comparison')) {
    return isLoadingOrReloading([
      comparisonLeft.type,
      comparisonRight.type,
      timelineSides.left.type,
      timelineSides.right.type,
      leftTimeline.type,
      rightTimeline.type,
    ]);
  }

  if (pathname.endsWith('comparison-diff')) {
    return isLoadingOrReloading([
      diffView.type,
      timelineSides.left.type,
      timelineSides.right.type,
      leftTimeline.type,
      rightTimeline.type,
    ]);
  }

  // :man_shrug:
  console.warn(
    'Unknown page at pathname="%s"!. The main refresh button might not be correctly reporting the loading state.',
    pathname
  );

  return isLoadingOrReloading([
    comparisonLeft.type,
    comparisonRight.type,
    timelineSides.left.type,
    timelineSides.right.type,
    leftTimeline.type,
    rightTimeline.type,
    diffView.type,
    singleView.type,
    tagExplorerView.activeTagProfileLoadingType,
    tagExplorerView.groupsLoadingType,
  ]);
}

function useRefreshTimeRangePicker() {
  const dispatch = useAppDispatch();

  const isDataLoading = useIsDataLoadingPerPage();

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

  /** Refresh functionality */

  const { appsLoading, refreshApps } = useRefreshAppsPicker();
  const { isDataLoading, refreshData } = useRefreshTimeRangePicker();

  /** Time range */

  const { timeRange, setTimeRange, setTimeZone, zoom, navigate } = useTimeRangePicker(refreshApps);

  /** Component */
  return (
    <div className={styles.toolbar} data-testid="toolbar">
      <HorizontalGroup justify="space-between" align="flex-start">
        {/* App Selection */}
        <InlineFieldRow>
          <InlineField label="Service" data-testid="services-dropdown">
            <Select<string>
              value={selectedServiceName}
              options={serviceNameOptions}
              onChange={selectServiceName}
              aria-label="Services list"
            />
          </InlineField>
          <InlineField label="Profile" data-testid="profile-types-dropdown">
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
            onRefresh={() => {
              refreshApps();
            }}
            onIntervalChanged={() => null}
            isLoading={appsLoading}
            text={appsLoading ? 'Refreshing names' : undefined}
          />
        </InlineFieldRow>
        {/* Time range selection */}
        <HorizontalGroup align="flex-start">
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
