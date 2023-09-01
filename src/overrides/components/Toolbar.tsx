import React, { useCallback, useEffect, useMemo, useState } from 'react';
import 'react-dom';

import { useAppSelector, useAppDispatch } from '@pyroscope/redux/hooks';
import { Query } from '@pyroscope/models/query';
import {
  setDateRange,
  selectApps,
  reloadAppNames,
  selectQueries,
  selectAppNamesState,
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
import { GrafanaTheme2, SelectableValue, TimeRange, getDefaultTimeRange } from '@grafana/data';
import { appFromQuery, appToQuery } from 'grafana-pyroscope/public/app/models/app';
import { css } from '@emotion/css';
import { translateGrafanaTimeRangeToPyroscope, translatePyroscopeTimeRangeToGrafana } from '../../utils/translation';
import { isLoadingOrReloading } from 'grafana-pyroscope/public/app/pages/loading';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    category: css`
      color: ${theme.colors.text.secondary};
    `,
    profileName: css`
      color: ${theme.colors.text.maxContrast};
      font-weight: bolder;
    `,
  };
};

type AppProfileType = NonNullable<ReturnType<typeof appFromQuery>>;

interface ToolbarProps {
  /** callback to be called when an app is selected via the dropdown */
  onSelectedApp: (name: Query) => void;

  filterApp?: (names: string) => boolean;
}
function Toolbar({ onSelectedApp, filterApp: _filterApp = () => true }: ToolbarProps) {
  const styles = useStyles2(getStyles);
  const dispatch = useAppDispatch();

  /** Gather pyroscope state */
  const appNamesState = useAppSelector(selectAppNamesState);
  const apps = useAppSelector(selectApps);
  const { query } = useAppSelector(selectQueries);
  const {
    from,
    until,
    comparisonView: { comparisonMode },
  } = useAppSelector(selectContinuousState);

  /** Evaluate loading status */
  const isLoading = useResultsLoadingCheck();
  const appsLoading = appNamesState.type === 'reloading';

  /** Toolbar local state */
  const [selectedApp, setSelectedApp] = useState<AppProfileType>();

  const [serviceName, setServiceName] = useState<string>();

  const [appProfileType, setAppProfileType] = useState<string>();

  /** Initialize state from query (first time only) */
  useEffect(() => {
    // If the serviceName or appProfileType hasn't been set yet, derive it from the query
    if (serviceName === undefined && appProfileType === undefined) {
      const app = appFromQuery(query);
      const currentServiceName = app?.name;
      const currentProfileType = app?.__profile_type__;

      setServiceName(currentServiceName);
      setAppProfileType(currentProfileType);
    }
  }, [query, serviceName, appProfileType]);

  /** Create drop-down selector options */

  const serviceNameOptions: Array<SelectableValue<string>> = useMemo(() => createAppNameSelectables(apps), [apps]);

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(() => {
    return apps.filter((app) => app.name === serviceName).map((app) => createProfileSelectable(app, styles));
  }, [serviceName, apps, styles]);

  /** Trigger a query change if the user selects a new app name / profile combo. */
  useEffect(() => {
    const app = apps.find((app) => app.name === serviceName && app.__profile_type__ === appProfileType);

    if (app) {
      // If we have successfully found an app
      // Check if the selected app has changed
      if (selectedApp?.name !== app.name || selectedApp.__profile_type__ !== app.__profile_type__) {
        // Report to the local state that we have changed the app for future comparison
        setSelectedApp(app);

        // Update pyroscope with the new query, due to a selection of a different app.
        const query: Query = appToQuery(app);
        onSelectedApp(query);
      }
    } else {
      // The combination of serviceName and appProfileType do not yield a valid app, let's choose an app
      const matchingApps = apps.filter((app) => app.name === serviceName);

      // Sometimes similar profile types might start with the same category and name, but have differing
      // identifiers after subsequent `:`-separators.
      // Do we have a profile type with the same category and name?
      const { category, name } = getCommonProfileCategoryAndName(appProfileType);
      const categoryAndName = `${category}:${name}`;
      let successfulMatch = matchingApps.find((app) => app.__profile_type__.startsWith(categoryAndName));

      if (!successfulMatch) {
        // No? Let's try to default to a profile type name with cpu?
        successfulMatch = matchingApps.find(
          (app) => getCommonProfileCategoryAndName(app.__profile_type__).name === 'cpu'
        );
      }

      if (!successfulMatch) {
        // Fine, we'll just take the first app.
        successfulMatch = matchingApps[0];
      }

      if (successfulMatch) {
        // If any of the above criteria yielded an actual result, let us set it now.
        setAppProfileType(successfulMatch.__profile_type__);
      }
    }
  }, [apps, onSelectedApp, selectedApp, serviceName, appProfileType, setSelectedApp, setAppProfileType]);

  /** Time range management */

  const [timeRange, setTimeRange] = useState<TimeRange>(getDefaultTimeRange());

  // Match the grafana time range selector to the pyroscope from/until state whenever it changes
  useEffect(() => {
    // When `from` and `until` change, update the grafana time range picker.
    const grafanaTimeRange = translatePyroscopeTimeRangeToGrafana(from, until);
    setTimeRange(grafanaTimeRange);
  }, [from, until]);

  const handleChangeDataRange = useCallback(
    (timeRange: TimeRange) => {
      const pyroscopeTimeRange = translateGrafanaTimeRangeToPyroscope(timeRange);

      dispatch(setDateRange(pyroscopeTimeRange));

      // When this component changes the time range, we clear the comparison mode `active` flag
      if (comparisonMode.active) {
        dispatch(
          actions.setComparisonMode({
            ...comparisonMode,
            active: false,
          })
        );
      }
    },
    [dispatch, comparisonMode]
  );

  function setTimeZone(timezone: string) {
    // No op
  }

  const zoom = useCallback(() => {
    // Zooming out will double the overall range.
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
    handleChangeDataRange(newRange);
  }, [timeRange, handleChangeDataRange]);

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
      handleChangeDataRange(newRange);
    },
    [timeRange, handleChangeDataRange]
  );

  /** Refresh functionality */

  function refreshApps() {
    dispatch(reloadAppNames());
  }

  function refreshData() {
    dispatch(actions.refresh());
  }

  /** Component */
  return (
    <HorizontalGroup justify="space-between">
      {/* App Selection */}
      <InlineFieldRow>
        <InlineField label="Service">
          <Select<string>
            value={serviceName}
            options={serviceNameOptions}
            onChange={(selection) => setServiceName(selection.value)}
          />
        </InlineField>
        <InlineField label="Profile">
          <Select<string>
            value={appProfileType}
            options={profileTypeOptions}
            onChange={(selection) => setAppProfileType(selection.value)}
          />
        </InlineField>
        <RefreshPicker
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
          onChange={handleChangeDataRange}
          onChangeTimeZone={setTimeZone}
          value={timeRange}
          onZoom={zoom}
          onMoveBackward={() => navigate(false)}
          onMoveForward={() => navigate(true)}
        />
        <RefreshPicker
          noIntervalPicker={true}
          onRefresh={refreshData}
          onIntervalChanged={() => null}
          isLoading={isLoading}
        />
      </HorizontalGroup>
    </HorizontalGroup>
  );
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

function createAppNameSelectables(apps: AppProfileType[]) {
  const names = new Set<string>();
  apps.forEach((app) => names.add(app.name));

  return Array.from(names).map(createAppNameSelectable);
}

function createAppNameSelectable(name: string): SelectableValue<string> {
  return {
    value: name,
    label: name,
    icon: 'sitemap',
  };
}

function createProfileSelectable(app: AppProfileType, styles: ReturnType<typeof getStyles>): SelectableValue<string> {
  const value = app.__profile_type__;

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

function getCommonProfileCategoryAndName(profileType = ':') {
  const [category, name] = profileType.split(':', 2);
  return { category, name };
}

export default Toolbar;
