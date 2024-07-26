import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { PanelType } from '../../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../../components/SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../../components/SceneDrawer';
import { SceneLabelValuesBarGauge } from '../../components/SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../../components/SceneLabelValuesTimeseries';
import { SceneProfilesExplorer } from '../../components/SceneProfilesExplorer/SceneProfilesExplorer';
import { CompareAction } from '../../domain/actions/CompareAction';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventAddLabelToFilters } from '../../domain/events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../domain/events/EventExpandPanel';
import { EventSelectLabel } from '../../domain/events/EventSelectLabel';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { addFilter } from '../../domain/variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../../infrastructure/series/helpers/getProfileMetricLabel';

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
        headerActions: (item, items) => {
          const { queryRunnerParams } = item;

          if (!queryRunnerParams.groupBy) {
            if (items.length > 1) {
              return [
                new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
                new SelectAction({ EventClass: EventAddLabelToFilters, item }),
                new CompareAction({ item }),
                new FavAction({ item }),
              ];
            }

            return [
              new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new FavAction({ item }),
            ];
          }

          if (queryRunnerParams.groupBy.values.length > 1) {
            return [
              new SelectAction({ EventClass: EventSelectLabel, item }),
              new SelectAction({ EventClass: EventExpandPanel, item }),
              new FavAction({ item }),
            ];
          }

          return [new FavAction({ item })];
        },
      }),
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const quickFilter = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    quickFilter.setPlaceholder('Search labels (comma-separated regexes are supported)');

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

    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return {
      unsubscribe() {
        expandPanelSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  selectLabel({ queryRunnerParams }: GridItemData) {
    const labelValue = queryRunnerParams!.groupBy!.label;
    const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;

    // we clear the filter before changing the groupBy value because changing it will _directly_ cause the grid items to be updated
    // by doing so, we prevent a flash of "No results"
    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).clear();

    groupByVariable.changeValueTo(labelValue);

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

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).clear();
  }

  openExpandedPanelDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: this.buildtimeSeriesPanelTitle(item),
      body:
        item.panelType === PanelType.BARGAUGE
          ? new SceneLabelValuesBarGauge({
              item,
              headerActions: () => [new SelectAction({ EventClass: EventSelectLabel, item }), new FavAction({ item })],
            })
          : new SceneLabelValuesTimeseries({
              displayAllValues: true,
              item,
              headerActions: () => [new SelectAction({ EventClass: EventSelectLabel, item }), new FavAction({ item })],
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
