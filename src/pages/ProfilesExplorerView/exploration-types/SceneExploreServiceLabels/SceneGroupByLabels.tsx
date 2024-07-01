import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2, LoadingState } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Stack, TableCellDisplayMode, useStyles2 } from '@grafana/ui';
import { merge } from 'lodash';
import React from 'react';

import { CompareAction } from '../../actions/CompareAction';
import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/GridItemData';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { SceneDrawer } from '../../components/SceneDrawer';
import { SceneQuickFilter } from '../../components/SceneQuickFilter';
import { getProfileMetricLabel } from '../../data/series/helpers/getProfileMetricLabel';
import { getProfileMetricUnit } from '../../data/series/helpers/getProfileMetricUnit';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { EventAddLabelToFilters } from '../../events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../events/EventExpandPanel';
import { EventSelectLabel } from '../../events/EventSelectLabel';
import { EventViewLabelValuesDistribution } from '../../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { buildtimeSeriesPanelTitle } from '../../helpers/buildtimeSeriesPanelTitle';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { findSceneObjectByKey } from '../../helpers/findSceneObjectByKey';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { SceneProfilesExplorer } from '../../SceneProfilesExplorer';
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
    const { queryRunnerParams } = item;
    const { label, allValues } = queryRunnerParams.groupBy!;

    const transformedData = new SceneDataTransformer({
      $data: buildTimeSeriesQueryRunner(queryRunnerParams, true),
      transformations: [
        {
          id: 'reduce',
          options: {
            labelsToFields: true,
            reducers: ['mean', 'stdDev', 'sum'],
          },
        },
        {
          id: 'filterFieldsByName',
          options: {
            byVariable: false,
            include: {
              names: [label, 'Mean', 'StdDev', 'Total'],
            },
          },
        },
      ],
    });

    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;
    const profileMetricUnit = getProfileMetricUnit(profileMetricId);
    const profileMetricLabel = getProfileMetricLabel(profileMetricId);

    const tablePanel = PanelBuilders.table()
      .setData(transformedData)
      .setTitle(`${label} (${allValues!.length})`)
      .setDisplayMode('transparent')
      .setCustomFieldConfig('filterable', true)
      .setCustomFieldConfig('cellOptions', { type: TableCellDisplayMode.ColorText })
      .setColor({ mode: 'fixed', fixedColor: '#CCCCDC' })
      .setUnit(profileMetricUnit)
      .setOverrides((overrides) => {
        overrides.matchFieldsWithName(queryRunnerParams.groupBy!.label).overrideUnit('string');
      })
      .setHeaderActions([
        new SelectAction({ EventClass: EventSelectLabel, item }),
        new SelectAction({ EventClass: EventExpandPanel, item }),
      ])
      .setOption('sortBy', [{ displayName: 'Total', desc: true }])
      .build();

    transformedData.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Done) {
        return;
      }

      const { fields } = newState.data.series[0];

      const newFieldConfig = merge({}, tablePanel.state.fieldConfig, {
        defaults: {
          mappings: [
            {
              type: 'value',
              options: fields[0].values.reduce((acc, value, j) => {
                acc[value] = {
                  text: value,
                  color: getColorByIndex(j),
                  index: j,
                };
                return acc;
              }, {}),
            },
          ],
        },
      });

      tablePanel.setState({ fieldConfig: newFieldConfig });
    });

    this.state.drawer.open({
      title: `${profileMetricLabel} values distribution for label "${queryRunnerParams.groupBy!.label}"`,
      body: tablePanel,
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneByVariableRepeaterGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body!.clone() as VizPanel;

    const { queryRunnerParams } = item;
    const { label } = queryRunnerParams.groupBy!;

    timeSeriesPanel.setState({
      title: label,
      $data: buildTimeSeriesQueryRunner(queryRunnerParams, true),
      headerActions: [
        new SelectAction({ EventClass: EventSelectLabel, item }),
        new SelectAction({ EventClass: EventViewLabelValuesDistribution, item }),
        new FavAction({ item }),
      ],
      fieldConfig: {
        defaults: {
          custom: {
            fillOpacity: 0,
          },
        },
        overrides: [],
      },
    });

    this.state.drawer.open({
      title: buildtimeSeriesPanelTitle(this),
      body: timeSeriesPanel,
    });
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
