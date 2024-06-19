import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2, IconName } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import { Drawer, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { LabelsDataSource } from '../data/LabelsDataSource';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventAddLabelToFilters } from '../events/EventAddLabelToFilters';
import { EventExpandPanel } from '../events/EventExpandPanel';
import { EventSelectLabel } from '../events/EventSelectLabel';
import { EventViewLabelValuesDistribution } from '../events/EventViewLabelValuesDistribution';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { findSceneObjectByKey } from '../helpers/findSceneObjectByKey';
import { SceneProfilesExplorer } from '../SceneProfilesExplorer/SceneProfilesExplorer';
import { GridItemData } from '../types/GridItemData';
import { addFilter } from '../variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../variables/GroupByVariable/GroupByVariable';

interface SceneGroupByLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  drawerContent?: VizPanel;
  drawerTitle?: string;
  drawerSubtitle?: string;
}

export class SceneGroupByLabels extends SceneObjectBase<SceneGroupByLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId', 'groupBy'],
    onReferencedVariableValueChanged: () => {
      // here we have to completely refresh the SceneTimeSeriesGrid
      this.setState({ body: this.state.body.clone() });
    },
  });

  constructor() {
    super({
      key: 'group-by-labels',
      body: new SceneTimeSeriesGrid({
        key: 'labels-grid',
        dataSource: PYROSCOPE_LABELS_DATA_SOURCE,
        headerActions: (item) => {
          if (!item.queryRunnerParams.groupBy) {
            return [new SelectAction({ EventClass: EventAddLabelToFilters, item }), new FavAction({ item })];
          }

          const actions = [];

          const { groupBy } = item.queryRunnerParams;

          const selectActionParams =
            groupBy.values.length === groupBy.allValues!.length
              ? { EventClass: EventSelectLabel, item }
              : {
                  EventClass: EventSelectLabel,
                  item,
                  icon: 'exclamation-circle' as IconName,
                  tooltip: `The number of timeseries on this panel has been reduced from ${
                    groupBy.allValues!.length
                  } to ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} to prevent long loading times.`,
                };

          actions.push(new SelectAction(selectActionParams));

          if (groupBy.values.length === 1) {
            actions.push(new SelectAction({ EventClass: EventAddLabelToFilters, item }));
          } else {
            actions.push(new SelectAction({ EventClass: EventViewLabelValuesDistribution, item }));
            actions.push(new SelectAction({ EventClass: EventExpandPanel, item }));
          }

          actions.push(new FavAction({ item }));

          return actions;
        },
      }),
      drawerContent: undefined,
      drawerTitle: undefined,
      drawerSubtitle: undefined,
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

    groupByVariable.changeValueTo(labelValue, labelValue);

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

    // the event may be published from an expanded panel in the drawer
    this.closeDrawer();
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
    goupByVariable.changeValueTo(GroupByVariable.DEFAULT_VALUE, GroupByVariable.DEFAULT_VALUE);
  }

  openLabelValuesDistributionDrawer({ queryRunnerParams }: GridItemData) {
    const transformedData = new SceneDataTransformer({
      $data: buildTimeSeriesQueryRunner(
        {
          ...queryRunnerParams,
          groupBy: {
            label: queryRunnerParams.groupBy!.label,
            values: queryRunnerParams.groupBy!.allValues!,
          },
        },
        true
      ),
      transformations: [
        {
          id: 'reduce',
          options: {
            labelsToFields: true,
            reducers: ['mean', 'stdDev', 'sum'],
          },
        },
      ],
    });

    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;
    const profileMetricLabel = ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId);
    const profileMetricUnit = ProfileMetricsDataSource.getProfileMetricUnit(profileMetricId);

    this.setState({
      drawerTitle: `${profileMetricLabel} values distribution for label "${queryRunnerParams.groupBy!.label}"`,
      drawerSubtitle: '',
      drawerContent: PanelBuilders.table()
        .setData(transformedData)
        .setUnit(profileMetricUnit)
        .setDisplayMode('transparent')
        .setCustomFieldConfig('align', 'left')
        .setCustomFieldConfig('filterable', true)
        .setOverrides((overrides) => {
          overrides.matchFieldsWithName('Field').overrideCustomFieldConfig('hidden', true);
        })
        .build(),
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneTimeSeriesGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body!.clone() as VizPanel;

    timeSeriesPanel.setState({
      // TS: we should be thorough and use all action types (FavAction as well) but it's good enough for what we want to do here
      headerActions: (timeSeriesPanel.state.headerActions as SelectAction[]).filter(
        (action) => action.state.EventClass !== EventExpandPanel
      ),
    });

    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;

    this.setState({
      drawerTitle: `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`,
      drawerSubtitle: '',
      drawerContent: timeSeriesPanel as VizPanel,
    });
  }

  closeDrawer = () => {
    this.setState({ drawerContent: undefined, drawerTitle: undefined, drawerSubtitle: undefined });
  };

  static Component = ({ model }: SceneComponentProps<SceneGroupByLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, drawerContent, drawerTitle, drawerSubtitle } = model.useState();

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

        {drawerContent && (
          <Drawer size="lg" title={drawerTitle} subtitle={drawerSubtitle} closeOnMaskClick onClose={model.closeDrawer}>
            <drawerContent.Component model={drawerContent} />
          </Drawer>
        )}
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
