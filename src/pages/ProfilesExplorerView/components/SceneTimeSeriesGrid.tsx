import { DashboardCursorSync, FieldMatcherID, LoadingState } from '@grafana/data';
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

import { buildTimeSeriesGroupByQueryRunner } from '../data/buildTimeSeriesGroupByQueryRunner';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { getDataSourceError } from '../data/getDataSourceError';
import { DataSourceDef, PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from '../types/GridItemData';
import { EmptyStateScene } from './EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from './SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from './SceneNoDataSwitcher';
import { SceneQuickFilter } from './SceneQuickFilter';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  dataSource: DataSourceDef;
  items: {
    data: GridItemData[];
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
    // allow the user to reload the list only by clicking on the "Refresh" button
    // if we don't do this, every time the time range changes (even with auto-refresh on), all the timeseries present on the screen are re-created,
    // resulting in blinking and a poor UX
    const refreshButton = document.querySelector(
      '[data-testid="data-testid RefreshPicker run button"]'
    ) as HTMLButtonElement;

    if (!refreshButton) {
      console.error('SceneTimeSeriesGrid: Refresh button not found! The list of items will never be updated.');
    }

    const onClickRefresh = () => {
      sub = this.state.$data!.subscribeToState(onChangeState);
    };

    refreshButton?.addEventListener('click', onClickRefresh);
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

        this.updateItems({
          data: series[0].fields[0].values,
          isLoading: false,
          error: null,
        });
      }
    };

    sub = this.state.$data!.subscribeToState(onChangeState);

    return {
      unsubscribe() {
        refreshButton?.removeEventListener('click', onClickRefresh);
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

  updateItems(items: SceneTimeSeriesGridState['items']) {
    this.setState({ items });

    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    this.updateGridItems(this.filterItems(quickFilterScene.state.searchText, items));
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateGridItems(items: SceneTimeSeriesGridState['items']) {
    const gridItems = items.data.map((item) => {
      const { value, label, queryRunnerParams } = item;
      const gridItemKey = `grid-item-${value}`;

      const shouldRefreshFavoriteData =
        this.state.dataSource.uid === PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE.uid && queryRunnerParams.groupBy;

      // in case of the favorites grid with a groupBy param, we always refetch the label values so that the timeseries are up-to-date
      // see buildTimeSeriesGroupByQueryRunner()
      const data: SceneQueryRunner = shouldRefreshFavoriteData
        ? new SceneQueryRunner({
            datasource: this.state.dataSource,
            queries: [],
          })
        : buildTimeSeriesQueryRunner(queryRunnerParams);

      if (!shouldRefreshFavoriteData && this.state.hideNoData) {
        this.setupHideNoData(data, gridItemKey);
      }

      const timeSeriesPanel = PanelBuilders.timeseries()
        .setTitle(label)
        .setData(data)
        .setColor({ mode: 'fixed', fixedColor: getColorByIndex(item.index) })
        .setOverrides((overrides) => {
          if (data.state.queries.length > 1) {
            data.state.queries.forEach(({ refId }, j: number) => {
              // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
              overrides
                .matchFieldsByQuery(refId)
                .overrideColor({ mode: 'fixed', fixedColor: getColorByIndex(item.index + j) })
                .overrideDisplayName(refId.split('-').pop());
            });
          }
        })
        .setCustomFieldConfig('fillOpacity', 9)
        .setHeaderActions(this.state.headerActions(item))
        .build();

      if (shouldRefreshFavoriteData) {
        setTimeout(async () => {
          const timeRange = sceneGraph.getTimeRange(this).state.value;
          const $data = await buildTimeSeriesGroupByQueryRunner(queryRunnerParams, timeRange);

          if (this.state.hideNoData) {
            this.setupHideNoData($data, gridItemKey);
          }

          timeSeriesPanel.setState({
            $data,
            fieldConfig: {
              defaults: {},
              // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
              overrides: $data.state.queries.map(({ refId }, j) => ({
                matcher: { id: FieldMatcherID.byFrameRefID, options: refId },
                properties: [
                  { id: 'displayName', value: refId.split('-').pop() },
                  { id: 'color', value: { mode: 'fixed', fixedColor: getColorByIndex(item.index + j) } },
                ],
              })),
            },
          });
        }, 0);
      }

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: timeSeriesPanel,
      });
    });

    if (!gridItems.length) {
      this.renderEmptyState();
      return;
    }

    (this.state.body as SceneCSSGridLayout).setState({
      children: gridItems,
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
    });
  }

  setupHideNoData(data: SceneQueryRunner, gridItemKey: string) {
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
