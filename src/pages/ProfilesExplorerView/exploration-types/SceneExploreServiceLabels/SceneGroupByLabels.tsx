import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { CompareAction } from '../../actions/CompareAction';
import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneAllLabelValuesTable } from '../../components/SceneAllLabelValuesTable';
import { SceneAllLabelValuesTimeseries } from '../../components/SceneAllLabelValuesTimeseries';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/GridItemData';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { SceneQuickFilter } from '../../components/SceneByVariableRepeaterGrid/SceneQuickFilter';
import { SceneDrawer } from '../../components/SceneDrawer';
import { SceneProfilesExplorer } from '../../components/SceneProfilesExplorer/SceneProfilesExplorer';
import { getProfileMetricLabel } from '../../data/series/helpers/getProfileMetricLabel';
import { EventAddLabelToFilters } from '../../events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../events/EventExpandPanel';
import { EventSelectLabel } from '../../events/EventSelectLabel';
import { EventViewLabelValuesDistribution } from '../../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { addFilter } from '../../variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../../variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../variables/GroupByVariable/GroupByVariable';

interface SceneGroupByLabelsState extends SceneObjectState {
  body: SceneByVariableRepeaterGrid;
  drawer: SceneDrawer;
}

export class SceneGroupByLabels extends SceneObjectBase<SceneGroupByLabelsState> {
  constructor() {
    super({
      key: 'group-by-labels',
      body: new SceneByVariableRepeaterGrid({
        key: 'service-labels-grid',
        variableName: 'groupBy',
        // no explicit dependency because they are already expressed in GroupByVariable
        // also, we could add filters, but we would reload all labels each time they are modified
        dependentVariableNames: [],
        headerActions: (item) => {
          const { queryRunnerParams } = item;

          if (!queryRunnerParams.groupBy || queryRunnerParams.groupBy.values.length === 1) {
            return [
              new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new CompareAction({ item }),
              new FavAction({ item }),
            ];
          }

          return [
            new SelectAction({ EventClass: EventSelectLabel, item }),
            new SelectAction({ EventClass: EventViewLabelValuesDistribution, item }),
            new SelectAction({ EventClass: EventExpandPanel, item }),
            new FavAction({ item }),
          ];
        },
      }),
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).setPlaceholder(
      'Search labels (comma-separated regexes are supported)'
    );

    const eventsSub = this.subscribeToEvents();

    return () => {
      eventsSub.unsubscribe();
    };
  }

  subscribeToEvents() {
    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
      this.selectLabel(event.payload.item);
    });

    const addToFiltersSub = this.subscribeToEvent(EventAddLabelToFilters, (event) => {
      this.addLabelValueToFilters(event.payload.item);
    });

    const labelValuesDistSub = this.subscribeToEvent(EventViewLabelValuesDistribution, async (event) => {
      this.openLabelValuesDistributionDrawer(event.payload.item);
    });

    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return {
      unsubscribe() {
        expandPanelSub.unsubscribe();
        labelValuesDistSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  selectLabel({ queryRunnerParams }: GridItemData) {
    const labelValue = queryRunnerParams!.groupBy!.label;
    const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;

    groupByVariable.changeValueTo(labelValue);

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

    // the event may be published from an expanded panel in the drawer
    this.state.drawer.close();
  }

  addLabelValueToFilters(item: GridItemData) {
    const filterByVariable = findSceneObjectByClass(this, FiltersVariable) as FiltersVariable;

    let filterToAdd: AdHocVariableFilter;
    const { filters, groupBy } = item.queryRunnerParams;

    if (filters?.[0]) {
      filterToAdd = filters?.[0];
    } else if (groupBy?.values.length === 1) {
      filterToAdd = { key: groupBy.label, operator: '=', value: groupBy.values[0] };
    } else {
      const error = new Error('Cannot build filter! Missing "filters" and "groupBy" value.');
      console.error(error);
      console.info(item);
      throw error;
    }

    addFilter(filterByVariable, filterToAdd);

    const goupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;
    goupByVariable.changeValueTo(GroupByVariable.DEFAULT_VALUE);

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();
  }

  openLabelValuesDistributionDrawer(item: GridItemData) {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const profileMetricLabel = getProfileMetric(profileMetricId as ProfileMetricId).type;

    this.state.drawer.open({
      title: `${profileMetricLabel} values distribution for label "${item.queryRunnerParams.groupBy!.label}"`,
      body: new SceneAllLabelValuesTable({
        item,
        headerActions: () => [
          new SelectAction({ EventClass: EventSelectLabel, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new SelectAction({ EventClass: EventExpandPanel, item }),
        ],
      }),
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: this.buildtimeSeriesPanelTitle(item),
      body: new SceneAllLabelValuesTimeseries({
        item,
        headerActions: () => [
          new SelectAction({ EventClass: EventSelectLabel, item }),
          new SelectAction({ EventClass: EventViewLabelValuesDistribution, item }),
          new FavAction({ item }),
        ],
      }),
    });
  }

  buildtimeSeriesPanelTitle(item: GridItemData) {
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    return `${serviceName} · ${getProfileMetricLabel(profileMetricId)} · ${item.label}`;
  }

  static Component = ({ model }: SceneComponentProps<SceneGroupByLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, drawer } = model.useState();

    const groupByVariable = findSceneObjectByClass(model, GroupByVariable);
    const { gridControls } = (findSceneObjectByClass(model, SceneProfilesExplorer) as SceneProfilesExplorer).state;

    return (
      <div className={styles.container}>
        <groupByVariable.Component model={groupByVariable} />

        <div className={styles.sceneControls}>
          {gridControls.length ? (
            <Stack wrap="wrap">
              {gridControls.map((control) => (
                <control.Component key={control.key} model={control} />
              ))}
            </Stack>
          ) : null}
        </div>

        {<body.Component model={body} />}
        {<drawer.Component model={drawer} />}
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-top: ${theme.spacing(1)};
  `,
  sceneControls: css`
    margin-bottom: ${theme.spacing(1)};
  `,
});
