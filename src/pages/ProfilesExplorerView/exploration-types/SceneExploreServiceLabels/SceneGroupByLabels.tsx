import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2, IconName, LoadingState } from '@grafana/data';
import { config } from '@grafana/runtime';
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
import { Drawer, Stack, TableCellDisplayMode, useStyles2 } from '@grafana/ui';
import { buildQuery } from '@shared/domain/url-params/parseQuery';
import { merge, uniq } from 'lodash';
import React from 'react';

import { CompareAction } from '../../actions/CompareAction';
import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneNoDataSwitcher } from '../../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../../components/SceneQuickFilter';
import { GridItemData } from '../../components/SceneTimeSeriesGrid/GridItemData';
import { SceneTimeSeriesGrid } from '../../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';
import { LabelsDataSource } from '../../data/labels/LabelsDataSource';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../../data/pyroscope-data-sources';
import { getProfileMetricLabel } from '../../data/series/helpers/getProfileMetricLabel';
import { getProfileMetricUnit } from '../../data/series/helpers/getProfileMetricUnit';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { EventAddLabelToFilters } from '../../events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../events/EventExpandPanel';
import { EventSelectForCompare } from '../../events/EventSelectForCompare';
import { EventSelectLabel } from '../../events/EventSelectLabel';
import { EventViewLabelValuesDistribution } from '../../events/EventViewLabelValuesDistribution';
import { buildtimeSeriesPanelTitle } from '../../helpers/buildtimeSeriesPanelTitle';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { findSceneObjectByKey } from '../../helpers/findSceneObjectByKey';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { SceneProfilesExplorer } from '../../SceneProfilesExplorer';
import { addFilter } from '../../variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../../variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../variables/GroupByVariable/GroupByVariable';

interface SceneGroupByLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  drawerContent?: VizPanel;
  drawerTitle?: string;
  drawerSubtitle?: string;
  itemsForComparison: Array<{ action: CompareAction; item: GridItemData }>;
}

export class SceneGroupByLabels extends SceneObjectBase<SceneGroupByLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['filters'],
    onReferencedVariableValueChanged: () => {
      const { itemsForComparison } = this.state;
      const isDiffEnabled = itemsForComparison.length === 2;

      this.updateItemsForComparison(itemsForComparison, isDiffEnabled);
    },
  });

  constructor() {
    super({
      key: 'group-by-labels',
      body: new SceneTimeSeriesGrid({
        key: 'labels-grid',
        query: {
          dataSource: PYROSCOPE_LABELS_DATA_SOURCE,
          target: '$profileMetricId{service_name="$serviceName"}',
        },
        headerActions: (item) => {
          if (!item.queryRunnerParams.groupBy) {
            return [
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new CompareAction({ item }),
              new FavAction({ item }),
            ];
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
                  } to ${
                    LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
                  } to prevent long loading times. Click on the "Expand panel" or the "Values distributions" icon to view all the values.`,
                };

          actions.push(new SelectAction(selectActionParams));

          if (groupBy.values.length === 1) {
            actions.push(new SelectAction({ EventClass: EventAddLabelToFilters, item }));
            actions.push(new CompareAction({ item }));
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
      itemsForComparison: [],
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
    (findSceneObjectByClass(this, GroupByVariable) as GroupByVariable).subscribeToState((newState, prevState) => {
      // we refresh the grid either when clicking on a groupBy value or when it finishes loading
      // which happens every time serviceName or profileMetricId changes
      // (see src/pages/ProfilesExplorerView/variables/GroupByVariable/GroupByVariable.tsx)
      if (newState.value !== prevState.value || (!newState.loading && prevState.loading)) {
        this.setState({
          body: this.state.body.clone(),
          itemsForComparison: [],
        });
      }
    });

    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
      this.selectLabel(event.payload.item);
    });

    const addToFiltersSub = this.subscribeToEvent(EventAddLabelToFilters, (event) => {
      this.addLabelValueToFilters(event.payload.item);
    });

    const selectForCompareSub = this.subscribeToEvent(EventSelectForCompare, (event) => {
      this.selectForCompare(event.payload);
    });

    const hideNoDataSub = this.initHideNoDataChange();

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
        hideNoDataSub.unsubscribe();
        selectForCompareSub.unsubscribe();
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

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();
  }

  selectForCompare({ isChecked, action, item }: { isChecked: boolean; action: CompareAction; item: GridItemData }) {
    const newItemsForComparison = isChecked
      ? [...this.state.itemsForComparison, { action, item }]
      : this.state.itemsForComparison.filter((i) => i.item.value !== item.value);

    const isDiffEnabled = newItemsForComparison.length === 2;

    (sceneGraph.findAllObjects(this, (o) => o instanceof CompareAction) as CompareAction[]).forEach((a) =>
      a.setState({ isDisabled: isDiffEnabled })
    );

    this.state.itemsForComparison.forEach(({ action }) => {
      action.setState({
        isEnabled: isDiffEnabled,
        isDisabled: false,
      });
    });

    this.updateItemsForComparison(newItemsForComparison, isDiffEnabled);

    this.setState({
      itemsForComparison: newItemsForComparison,
    });
  }

  updateItemsForComparison(itemsForComparison: SceneGroupByLabelsState['itemsForComparison'], isDiffEnabled: boolean) {
    const diffUrl = isDiffEnabled ? this.buildDiffUrl(itemsForComparison) : '';

    itemsForComparison.forEach(({ action }) => {
      action.setState({
        isEnabled: isDiffEnabled,
        isDisabled: false,
        diffUrl,
      });
    });
  }

  buildDiffUrl(itemsForComparison: SceneGroupByLabelsState['itemsForComparison']) {
    let { appUrl } = config;
    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const diffUrl = new URL('a/grafana-pyroscope-app/comparison-diff', appUrl);

    // time range
    const { from, to } = sceneGraph.getTimeRange(this).state.value.raw;
    diffUrl.searchParams.set('from', from.toString());
    // FIXME: the param name should be the same as in the rest of Grafana
    diffUrl.searchParams.set('until', to.toString());

    const { filters: queryFilters } = (findSceneObjectByClass(this, FiltersVariable) as FiltersVariable).state;
    const { serviceName: serviceId, profileMetricId } = itemsForComparison[0].item.queryRunnerParams;

    // query - just in case
    const query = buildQuery({
      serviceId,
      profileMetricId,
      labels: queryFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`),
    });
    diffUrl.searchParams.set('query', query);

    // left & right queries
    const [leftQuery, rightQuery] = itemsForComparison
      .sort((a, b) => a.item.index - b.item.index)
      .map(({ item }) => {
        const { serviceName: serviceId, profileMetricId, filters } = item.queryRunnerParams;

        const labels = [...queryFilters, ...(filters || [])].map(
          ({ key, operator, value }) => `${key}${operator}"${value}"`
        );

        return buildQuery({ serviceId, profileMetricId, labels: uniq(labels) });
      });

    diffUrl.searchParams.set('leftQuery', leftQuery);
    diffUrl.searchParams.set('rightQuery', rightQuery);

    return diffUrl.toString();
  }

  initHideNoDataChange() {
    const noDataSwitcherScene = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    return noDataSwitcherScene.subscribeToState(() => {
      this.setState({ itemsForComparison: [] });
    });
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

    this.setState({
      drawerTitle: `${profileMetricLabel} values distribution for label "${queryRunnerParams.groupBy!.label}"`,
      drawerSubtitle: '',
      drawerContent: tablePanel,
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneTimeSeriesGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body!.clone() as VizPanel;

    const { queryRunnerParams } = item;
    const { label, allValues } = queryRunnerParams.groupBy!;

    timeSeriesPanel.setState({
      title: `${label} (${allValues!.length})`,
      $data: buildTimeSeriesQueryRunner(queryRunnerParams, true),
      headerActions: (timeSeriesPanel.state.headerActions as SelectAction[]).filter(
        (action) => action.state.EventClass !== EventExpandPanel
      ),
    });

    this.setState({
      drawerTitle: buildtimeSeriesPanelTitle(this),
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
