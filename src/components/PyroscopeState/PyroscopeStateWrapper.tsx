import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
  setQuery,
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
import { PyroscopeStateContext } from './context';
import { AppProfileType } from './types';
import { getCommonProfileCategoryAndName } from './util';

// Derive the QueryBrand type from the selector, since it isn't explicitly exported
type QueryBrand = ReturnType<typeof selectQueries>['leftQuery'];

export function PyroscopeStateWrapper(props: { children: ReactNode }) {
  /** Gather pyroscope state */
  const appNamesState = useAppSelector(selectAppNamesState);
  const apps = useAppSelector(selectApps);
  const { query } = useAppSelector(selectQueries);

  /** Functions to change pyroscope state */
  const dispatch = useAppDispatch();

  /** Evaluate loading status */
  const appsLoading = appNamesState.type === 'reloading';

  const [selectedServiceName, setSelectedServiceName] = useState<string>();

  const [selectedProfileType, setSelectedProfileType] = useState<string>();

  /** Time range management */
  const {
    from,
    until,
    comparisonView: { comparisonMode },
  } = useAppSelector(selectContinuousState);

  /** Trigger a change of query due to a change in the selected app */
  const onSelectedApp = useCallback(
    (query: QueryBrand) => {
      // Instead of using the callback that passed on the Toolbar, we allow this context-local equivalent handle app selection changes.

      // This is done more in `ContinuousComparisonView`
      // We will deactivate the comparison mode when a new app is selected
      dispatch(
        actions.setComparisonMode({
          ...comparisonMode,
          active: false,
        })
      );
      // This is done by all views when the app changes the query.
      dispatch(setQuery(query));
    },
    [dispatch, comparisonMode]
  );

  /** Update time range state from pyroscope from/until state whenever it changes */
  const timeRange = useMemo(() => {
    // When `from` and `until` change, update the grafana time range picker.
    const grafanaTimeRange = translatePyroscopeTimeRangeToGrafana(from, until);
    return grafanaTimeRange;
  }, [from, until]);

  const setTimeRange = useCallback(
    (timeRange: TimeRange) => {
      const pyroscopeTimeRange = translateGrafanaTimeRangeToPyroscope(timeRange);

      if (pyroscopeTimeRange.from !== from || pyroscopeTimeRange.until !== until) {
        // The range has indeed changed.
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
      }
    },
    [dispatch, comparisonMode, from, until]
  );

  /** Initialize app/profile state from query (first time only) */
  useEffect(() => {
    // If the serviceName or appProfileType hasn't been set yet, derive it from the query
    if (selectedServiceName === undefined && selectedProfileType === undefined) {
      const currentQueryApp = appFromQuery(query);
      const currentServiceName = currentQueryApp?.name;
      const currentProfileType = currentQueryApp?.__profile_type__;

      setSelectedServiceName(currentServiceName);
      setSelectedProfileType(currentProfileType);
    }
  }, [query, selectedServiceName, selectedProfileType]);

  /** Derive options from apps */

  // We use sets to internally evaluate if any of the options changed
  const [serviceNameSet, setServiceNameSet] = useState(new Set<string>());
  const [profileTypeSet, setProfileTypeSet] = useState(new Set<string>());

  useEffect(() => {
    // When the `apps` list changes,
    // let's evaluate if any of the service names are different or missing
    let needsReset = false;

    const names = new Set<string>();
    apps.forEach((app) => {
      const { name } = app;
      needsReset ||= !serviceNameSet.has(name);
      names.add(app.name);
    });

    if (needsReset || serviceNameSet.size !== names.size) {
      // We need to trigger an update for the updated set
      setServiceNameSet(names);
    }
  }, [apps, serviceNameSet]);

  const serviceNames = useMemo(() => {
    return Array.from(serviceNameSet).sort();
  }, [serviceNameSet]);

  useEffect(() => {
    // When the `apps` list changes (or the selected service name changes),
    // let's evaluate if any of the profile types are different or missing

    let needsReset = false;
    const profiles = new Set<string>();

    apps
      .filter((app) => app.name === selectedServiceName)
      .map((app) => app.__profile_type__)
      .forEach((profile) => {
        needsReset ||= !profileTypeSet.has(profile);
        profiles.add(profile);
      });

    if (needsReset || profiles.size !== profileTypeSet.size) {
      // We need to trigger an update for the updated set
      setProfileTypeSet(profiles);
    }
  }, [apps, profileTypeSet, selectedServiceName]);

  const profileTypes = useMemo(() => {
    return Array.from(profileTypeSet).sort();
  }, [profileTypeSet]);

  /** Trigger a query change if the user selects a new app name / profile combo. */
  useEffect(() => {
    const app = apps.find((app) => app.name === selectedServiceName && app.__profile_type__ === selectedProfileType);

    if (app) {
      // If we have successfully found an app
      // Check if the selected app has changed

      const currentQueryApp = appFromQuery(query);

      if (currentQueryApp?.name !== app.name || currentQueryApp.__profile_type__ !== app.__profile_type__) {
        // Report to the local state that we have changed the app for future comparison
        const newQuery = appToQuery(app);
        onSelectedApp(newQuery);
      }
    } else {
      // The combination of serviceName and appProfileType do not yield a valid app, let's choose an app
      const matchingApps = apps.filter((app) => app.name === selectedServiceName);

      // Sometimes similar profile types might start with the same category and name, but have differing
      // identifiers after subsequent `:`-separators.
      // Do we have a profile type with the same category and name?
      const { category, name } = getCommonProfileCategoryAndName(selectedProfileType);
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
        setSelectedProfileType(successfulMatch.__profile_type__);
      }
    }
  }, [apps, selectedServiceName, selectedProfileType, setSelectedProfileType, onSelectedApp, query]);

  return (
    <PyroscopeStateContext.Provider
      value={{
        appsLoading,

        serviceNames,
        profileTypes,

        selectedServiceName,
        selectedProfileType,

        setSelectedServiceName,
        setSelectedProfileType,

        timeRange,
        setTimeRange,
      }}
    >
      {props.children}
    </PyroscopeStateContext.Provider>
  );
}