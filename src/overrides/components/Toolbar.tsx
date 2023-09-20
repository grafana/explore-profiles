import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  useTheme2,
} from '@grafana/ui';
import { GrafanaTheme2, SelectableValue, TimeRange, getDefaultTimeRange } from '@grafana/data';
import { appToQuery } from 'grafana-pyroscope/public/app/models/app';
import { css } from '@emotion/css';
import { translateGrafanaTimeRangeToPyroscope, translatePyroscopeTimeRangeToGrafana } from '../../utils/translation';
import { isLoadingOrReloading } from '@pyroscope/pages/loading';
import { PyroscopeStateContext } from '../../components/PyroscopeState/context';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    category: css`
      color: ${theme.colors.text.secondary};
    `,
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

interface ToolbarProps {
  /** callback to be called when an app is selected via the dropdown */
  onSelectedApp: (name: Query) => void; // We don't use this. Instead we allow the PyroscopeStateContext to handle state changes.

  filterApp?: (names: string) => boolean;
}
function Toolbar({}: ToolbarProps) {
  const styles = useStyles2(getStyles);
  const dispatch = useAppDispatch();

  /** Evaluate loading status */
  const isLoading = useResultsLoadingCheck();

  const {
    appsLoading,

    serviceNames,
    profileTypes,

    selectedServiceName,
    setSelectedServiceName,

    selectedProfileType,
    setSelectedProfileType,

    timeRange,
    setTimeRange,
  } = useContext(PyroscopeStateContext);

  /** Create drop-down selector options */

  const serviceNameOptions: Array<SelectableValue<string>> = useMemo(
    () => createServiceNameSelectables(serviceNames),
    [serviceNames]
  );

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(
    () => profileTypes.map((app) => createProfileSelectable(app, styles)),
    [profileTypes, styles]
  );

  function setTimeZone(timezone: string) {
    // No op
  }

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

  /** Refresh functionality */

  function refreshApps() {
    dispatch(reloadAppNames());
  }

  function refreshData() {
    dispatch(actions.refresh());
  }

  const theme = useTheme2();

  /** Component */
  return (
    <div className={styles.toolbar}>
      <HorizontalGroup justify="space-between">
        {/* App Selection */}
        <InlineFieldRow>
          <InlineField label="Service">
            <Select<string>
              value={selectedServiceName}
              options={serviceNameOptions}
              onChange={(selection) => setSelectedServiceName(selection.value || '')}
            />
          </InlineField>
          <InlineField label="Profile">
            <Select<string>
              value={selectedProfileType}
              options={profileTypeOptions}
              onChange={(selection) => setSelectedProfileType(selection.value || '')}
            />
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
              isLoading={isLoading}
            />
          </div>
        </HorizontalGroup>
      </HorizontalGroup>
    </div>
  );
}

function createServiceNameSelectables(names: string[]) {
  return Array.from(names).map((name) => ({
    value: name,
    label: name,
    icon: 'sitemap',
  }));
}

function createProfileSelectable(value: string, styles: ReturnType<typeof getStyles>): SelectableValue<string> {
  const [category, name] = value.split(':');

  const labelComponent = (
    <>
      <span className={styles.category}>{category}:</span> <span className={styles.profileName}>{name}</span>
    </>
  );
  const imgUrl = 'public/plugins/grafana-pyroscope-app/img/logo.svg';

  // The underlying mechanism used by Grafana's <Select> accepts components for labels,
  // but the strict typing believes that it only accepts strings, so we lie about the type here.
  const label = labelComponent as unknown as string;

  return { label, value, imgUrl };
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

export default Toolbar;
