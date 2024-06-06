import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2 } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { Drawer, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { buildTimeSeriesGroupByQueryRunner } from '../data/buildTimeSeriesGroupByQueryRunner';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventAddToFilters } from '../events/EventAddToFilters';
import { EventSelectLabel } from '../events/EventSelectLabel';
import { EventShowPieChart } from '../events/EventShowPieChart';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer } from '../SceneProfilesExplorer';
import { FilterByVariable } from '../variables/FilterByVariable/FilterByVariable';
import { addFilter } from '../variables/FilterByVariable/filters-ops';
import { GroupByVariable } from '../variables/GroupByVariable/GroupByVariable';

interface SceneExploreLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  drawerContent?: VizPanel;
  drawerTitle?: string;
}

export class SceneExploreLabels extends SceneObjectBase<SceneExploreLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId', 'groupBy'],
    onReferencedVariableValueChanged: () => {
      // here we have to completely refresh the SceneTimeSeriesGrid
      this.setState({ body: this.state.body.clone() });
    },
  });

  constructor() {
    super({
      key: 'explore-labels',
      body: new SceneTimeSeriesGrid({
        key: 'labels-grid',
        dataSource: PYROSCOPE_LABELS_DATA_SOURCE,
        headerActions: (item) =>
          item.queryRunnerParams.groupBy
            ? ([
                new SelectAction({ EventClass: EventSelectLabel, item }),
                item.queryRunnerParams.groupBy.values.length === 1
                  ? new SelectAction({ EventClass: EventAddToFilters, item })
                  : undefined,
                item.queryRunnerParams.groupBy.values.length > 1
                  ? new SelectAction({ EventClass: EventShowPieChart, item })
                  : undefined,
                new FavAction({ item }),
              ].filter(Boolean) as VizPanelState['headerActions'])
            : [new SelectAction({ EventClass: EventAddToFilters, item }), new FavAction({ item })],
      }),
      drawerContent: undefined,
      drawerTitle: undefined,
    });

    this.addActivationHandler(() => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).setPlaceholder(
        'Search labels (comma-separated regexes are supported)'
      );

      const eventsSub = this.subscribeToEvents();

      return () => {
        eventsSub.unsubscribe();
      };
    });
  }

  subscribeToEvents() {
    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
      const labelValue = event.payload.item.queryRunnerParams!.groupBy!.label;
      const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;

      groupByVariable.changeValueTo(labelValue, labelValue);
    });

    const addToFiltersSub = this.subscribeToEvent(EventAddToFilters, (event) => {
      const filterByVariable = findSceneObjectByClass(this, FilterByVariable) as FilterByVariable;

      let filterToAdd: AdHocVariableFilter;
      const { filters, groupBy } = event.payload.item.queryRunnerParams;

      if (filters?.[0]) {
        filterToAdd = filters?.[0];
      } else if (groupBy?.values.length === 1) {
        filterToAdd = { key: groupBy.label, operator: '=', value: groupBy.values[0] };
      } else {
        const error = new Error('Cannot build filter! Missing "filters" and "groupBy" value.');
        console.error(error);
        console.info(event.payload.item);
        throw error;
      }

      addFilter(filterByVariable, filterToAdd);
    });

    const showPieChartSub = this.subscribeToEvent(EventShowPieChart, async (event) => {
      const { queryRunnerParams, index } = event.payload.item;
      const timeRange = sceneGraph.getTimeRange(this).state.value;

      const data = await buildTimeSeriesGroupByQueryRunner(queryRunnerParams, timeRange, Number.POSITIVE_INFINITY);

      this.setState({
        drawerTitle: `"${queryRunnerParams.groupBy!.label}" values distribution (${data.state.queries.length})`,
        drawerContent: PanelBuilders.piechart()
          .setData(data)
          .setOverrides((overrides) => {
            data.state.queries.forEach(({ refId, displayNameOverride }, j) => {
              // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
              overrides
                .matchFieldsByQuery(refId)
                .overrideColor({ mode: 'fixed', fixedColor: getColorByIndex(index + j) })
                .overrideDisplayName(displayNameOverride);
            });
          })
          .build(),
      });
    });

    return {
      unsubscribe() {
        showPieChartSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  static Component = ({ model }: SceneComponentProps<SceneExploreLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, drawerContent, drawerTitle } = model.useState();

    const groupByVariable = findSceneObjectByClass(model, GroupByVariable);
    const { gridControls } = (findSceneObjectByClass(model, SceneProfilesExplorer) as SceneProfilesExplorer).state;

    return (
      <>
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

        {drawerContent && (
          <Drawer
            size="lg"
            title={drawerTitle}
            closeOnMaskClick
            onClose={() => model.setState({ drawerContent: undefined, drawerTitle: undefined })}
          >
            <drawerContent.Component model={drawerContent} />
          </Drawer>
        )}
      </>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  sceneControls: css`
    padding: ${theme.spacing(1)} 0;
  `,
});
