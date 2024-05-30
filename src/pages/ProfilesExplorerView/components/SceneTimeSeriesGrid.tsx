import { DashboardCursorSync, LoadingState } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneDataProvider,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableDependencyConfig,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';
import { Unsubscribable } from 'rxjs';

import { EmptyStateScene } from '../components/EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { getDataSourceError } from '../data/getDataSourceError';
import { DataSourceDef } from '../data/pyroscope-data-source';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneNoDataSwitcher } from './SceneNoDataSwitcher';
import { SceneQuickFilter } from './SceneQuickFilter';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  headerActions: (params: Record<string, any>) => VizPanelState['headerActions'];
  dataSource: DataSourceDef;
  items: {
    data: Array<{
      label: string;
      value: string;
      queryRunnerParams: Record<string, any>;
      color?: string;
    }>;
    isLoading: boolean;
    error: Error | null;
  };
  hideNoData: boolean;
  $data: SceneQueryRunner;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneTimeSeriesGrid extends SceneObjectBase<SceneTimeSeriesGridState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      // if we don't reset the items list to its original value, we might get stuck with items that might not include (e.g.) the ones that had no data before
      // we also ensure that they are properly filtered after the change
      const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
      this.updateGridItems(this.filterItems(quickFilterScene.state.searchText));
    },
  });

  static DEFAULT_LAYOUT: LayoutType.GRID;

  constructor({
    key,
    dataSource,
    headerActions,
  }: {
    key: string;
    dataSource: SceneTimeSeriesGridState['dataSource'];
    headerActions: SceneTimeSeriesGridState['headerActions'];
  }) {
    super({
      key,
      dataSource,
      items: {
        data: [],
        isLoading: true,
        error: null,
      },
      hideNoData: false,
      headerActions,
      body: new SceneCSSGridLayout({
        templateColumns:
          SceneTimeSeriesGrid.DEFAULT_LAYOUT === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [],
      }),
      $data: new SceneQueryRunner({
        datasource: dataSource,
        queries: [
          {
            refId: `${dataSource.type}-${key}`,
            queryType: 'metrics',
            serviceName: '$serviceName',
            profileMetricId: '$profileMetricId',
          },
        ],
      }),
    });

    this.addActivationHandler(() => {
      const quickFilterSub = this.initQuickFilterChange();
      const layoutChangeSub = this.initLayoutChange();
      const hideNoDataSub = this.initHideNoDataChange();

      const itemsLoadingSub = this.initLoadItems();

      return () => {
        itemsLoadingSub.unsubscribe();
        hideNoDataSub.unsubscribe();
        layoutChangeSub.unsubscribe();
        quickFilterSub.unsubscribe();
      };
    });
  }

  initLoadItems() {
    let sub: Unsubscribable;

    // start of hack, for a better UX: once we've received the list of items, we unsubscribe from further changes (see `LoadingState.Done` below) and we
    // "hook into" the time range to allow the user to reload the list by clicking on the "Refresh" button
    // if we don't do this, every time the time range changes, all the timeseries present on the screen are re-created, resulting in blinking and a poor UX
    const $timeRange = sceneGraph.getTimeRange(this);
    const originalOnRefresh = $timeRange.onRefresh;

    $timeRange.onRefresh = (...args) => {
      sub = this.state.$data!.subscribeToState(onChangeState);
      originalOnRefresh(...args);
    };
    // end of hack

    const onChangeState = (newState: SceneDataProvider['state']) => {
      if (!newState.data) {
        return;
      }

      const { state, series, errors } = newState.data;

      if (state === LoadingState.Error) {
        this.updateItems({
          data: [],
          isLoading: false,
          error: getDataSourceError(errors),
        });

        return;
      }

      if (state === LoadingState.Done) {
        sub.unsubscribe();

        const { values } = series[0].fields[0];

        this.updateItems({
          data: values,
          isLoading: false,
          error: null,
        });
      }
    };

    sub = this.state.$data!.subscribeToState(onChangeState);

    return {
      unsubscribe() {
        $timeRange.onRefresh = originalOnRefresh;
        sub.unsubscribe();
      },
    };
  }

  initQuickFilterChange() {
    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;

    const onChangeState = (newState: typeof quickFilterScene.state, prevState?: typeof quickFilterScene.state) => {
      if (newState.searchText === prevState?.searchText) {
        return;
      }

      this.updateGridItems(this.filterItems(quickFilterScene.state.searchText));
    };

    onChangeState(quickFilterScene.state);

    return quickFilterScene.subscribeToState(debounce(onChangeState, 250));
  }

  initLayoutChange() {
    const layoutSwitcherScene = findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher;

    const body = this.state.body as SceneCSSGridLayout;

    const onChangeState = (
      newState: typeof layoutSwitcherScene.state,
      prevState?: typeof layoutSwitcherScene.state
    ) => {
      if (newState.layout === prevState?.layout) {
        return;
      }

      body.setState({
        templateColumns: newState.layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
      });
    };

    onChangeState(layoutSwitcherScene.state);

    return layoutSwitcherScene.subscribeToState(onChangeState);
  }

  initHideNoDataChange() {
    const noDataSwitcherScene = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    const onChangeState = (
      newState: typeof noDataSwitcherScene.state,
      prevState?: typeof noDataSwitcherScene.state
    ) => {
      if (newState.hideNoData === prevState?.hideNoData) {
        return;
      }

      this.setState({ hideNoData: newState.hideNoData === 'on' });
      this.updateItems(this.state.items);
    };

    onChangeState(noDataSwitcherScene.state);

    return noDataSwitcherScene.subscribeToState(onChangeState);
  }

  updateItems(items: SceneTimeSeriesGridState['items']) {
    this.setState({ items });

    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    this.updateGridItems(this.filterItems(quickFilterScene.state.searchText, items));
  }

  filterItems(searchText: string, optionalItems?: SceneTimeSeriesGridState['items']) {
    const items = optionalItems || this.state.items;

    if (!searchText) {
      return items;
    }

    const searchRegex = new RegExp(
      `(${searchText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .join('|')})`
    );

    return {
      ...items,
      data: items.data.filter(({ label }) => searchRegex.test(label)),
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateGridItems(items: SceneTimeSeriesGridState['items']) {
    const gridItems = items.data.map((item, i) => {
      const gridItemKey = `grid-item-${item.value}`;
      const color = item.color || getColorByIndex(i);

      const { queryRunnerParams } = item;
      const actionParams = { ...queryRunnerParams, color };

      const data = buildTimeSeriesQueryRunner(queryRunnerParams);

      if (this.state.hideNoData) {
        this._subs.add(
          data.subscribeToState((state) => {
            if (state.data?.state === LoadingState.Done && !state.data.series.length) {
              const gridItem = sceneGraph.getAncestor(data, SceneCSSGridItem);
              const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);
              const filteredChildren = grid.state.children.filter((c) => c.state.key !== gridItemKey);

              if (filteredChildren.length) {
                grid.setState({ children: filteredChildren });
              } else {
                this.renderEmptyState();
              }
            }
          })
        );
      }

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: PanelBuilders.timeseries()
          .setTitle(item.label)
          .setOption('legend', { showLegend: true })
          .setData(data)
          .setOverrides((overrides) => {
            queryRunnerParams.groupBy?.values?.forEach((labelValue: string, j: number) => {
              overrides
                .matchFieldsByQuery(
                  `${queryRunnerParams.serviceName}-${queryRunnerParams.profileMetricId}-${queryRunnerParams.groupBy.label}-${labelValue}`
                )
                .overrideColor({
                  mode: 'fixed',
                  fixedColor: getColorByIndex(i + j),
                })
                .overrideDisplayName(labelValue);
            });
          })
          .setColor({ mode: 'fixed', fixedColor: color })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions(this.state.headerActions(actionParams))
          .build(),
      });
    });

    if (!gridItems.length) {
      this.renderEmptyState();
      return;
    }

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS,
      children: gridItems,
    });
  }

  renderEmptyState() {
    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: '480px',
      children: [
        new SceneCSSGridItem({
          body: new EmptyStateScene({
            message: 'No results',
          }),
        }),
      ],
    });
  }

  static Component({ model }: SceneComponentProps<SceneTimeSeriesGrid>) {
    const { body, items } = model.useState();

    return items.isLoading ? <Spinner /> : <body.Component model={body} />;
  }
}
