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

import { getDataSourceError } from '../../data/helpers/getDataSourceError';
import { DataSourceDef, PYROSCOPE_PROFILE_FAVORITES_DATA_SOURCE } from '../../data/pyroscope-data-sources';
import { buildTimeSeriesGroupByQueryRunner } from '../../data/timeseries/buildTimeSeriesGroupByQueryRunner';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { GroupByVariable } from '../../variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../../variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../variables/ServiceNameVariable';
import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneNoDataSwitcher';
import { SceneQuickFilter } from '../SceneQuickFilter';
import { GridItemData } from './GridItemData';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  query: {
    dataSource: DataSourceDef;
    target?: string;
  };
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
      const notReady = sceneGraph.hasVariableDependencyInLoadingState(this);
      if (notReady) {
        return;
      }

      // if we don't reset the items list to its original value, we might get stuck with items that might not include (e.g.) the ones that had no data before
      // we also ensure that they are properly filtered after the change
      const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
      this.renderGridItems(this.filterItems(quickFilterScene.state.searchText));
    },
  });

  static DEFAULT_LAYOUT = LayoutType.GRID;

  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.value}`;
  }

  constructor({
    key,
    query,
    headerActions,
  }: {
    key: string;
    query: SceneTimeSeriesGridState['query'];
    headerActions: SceneTimeSeriesGridState['headerActions'];
  }) {
    super({
      key,
      query,
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
        datasource: query.dataSource,
        queries: [
          {
            refId: `${key}-${query.dataSource.type}-${query?.target || ''}`,
            target: query?.target || '',
          },
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
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
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  initLoadItems() {
    let sub: Unsubscribable;

    const subscribeOnceToDataChange = () => {
      sub = this.state.$data!.subscribeToState(onDataStateChange);
    };

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

    refreshButton?.addEventListener('click', subscribeOnceToDataChange);
    // end of hack

    // hack: we need to refresh the data when the data source changes
    const dataSourceSub = findSceneObjectByClass(this, ProfilesDataSourceVariable).subscribeToState(async () => {
      // prevent "flash of error" on each timeseries in the grid
      this.resetToLoadingState();

      // we do this to ensure that non-active variables (not rendered in the UI) have the correct values
      // after switching DS then going to a different exploration type
      // note: when active variables also subscribe to data source changes
      const updatesP = [ServiceNameVariable, ProfileMetricVariable]
        .map(
          (VariableClass) => findSceneObjectByClass(this, VariableClass) as ServiceNameVariable | ProfileMetricVariable
        )
        .filter((variable) => !variable.isActive)
        .map((variable) => variable.update(true));

      await updatesP;

      // groupBy depends on serviceName & profileMetricId for building a Pyroscope query
      // so we do it after the previous updates
      // (see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts)
      const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;
      if (!groupByVariable.isActive) {
        await groupByVariable.update();
      }

      subscribeOnceToDataChange();
      this.state.$data.runQueries();
    });

    const onDataStateChange = (newState: SceneDataProvider['state']) => {
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
        sub.unsubscribe(); // once

        this.updateItems({
          data: series[0].fields[0].values,
          isLoading: false,
          error: null,
        });
      }
    };

    subscribeOnceToDataChange();

    return {
      unsubscribe() {
        dataSourceSub.unsubscribe();
        refreshButton?.removeEventListener('click', subscribeOnceToDataChange);
        sub.unsubscribe();
      },
    };
  }

  resetToLoadingState() {
    this.updateItems({ data: [], isLoading: true, error: null });
  }

  initQuickFilterChange() {
    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;

    const onChangeState = (newState: typeof quickFilterScene.state, prevState?: typeof quickFilterScene.state) => {
      if (newState.searchText === prevState?.searchText) {
        return;
      }

      this.renderGridItems(this.filterItems(quickFilterScene.state.searchText));
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
    this.renderGridItems(this.filterItems(quickFilterScene.state.searchText, items));
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  renderGridItems(items: SceneTimeSeriesGridState['items']) {
    if (!items.data.length) {
      this.renderEmptyState();
      return;
    }

    const { query, hideNoData, headerActions, body } = this.state;

    const gridItems = items.data.map((item) => {
      const { label, queryRunnerParams } = item;
      const gridItemKey = SceneTimeSeriesGrid.buildGridItemKey(item);

      let data: SceneQueryRunner;

      const shouldRefreshFavoriteData =
        query.dataSource.uid === PYROSCOPE_PROFILE_FAVORITES_DATA_SOURCE.uid && queryRunnerParams.groupBy?.label;

      if (shouldRefreshFavoriteData) {
        // in case of the favorites grid with a groupBy param, we always refetch the label values so that the timeseries are up-to-date
        // see buildTimeSeriesGroupByQueryRunner()
        data = new SceneQueryRunner({
          datasource: query.dataSource,
          queries: [],
        });
      } else {
        data = buildTimeSeriesQueryRunner(queryRunnerParams);

        if (hideNoData) {
          this.setupHideNoData(data, gridItemKey);
        }
      }

      const timeSeriesPanel = PanelBuilders.timeseries()
        .setTitle(label)
        .setData(data)
        .setOverrides((overrides) => {
          data.state.queries.forEach(({ refId, displayNameOverride }, j: number) => {
            overrides
              .matchFieldsByQuery(refId)
              .overrideColor({ mode: 'fixed', fixedColor: getColorByIndex(item.index + j) })
              .overrideDisplayName(displayNameOverride);
          });
        })
        .setCustomFieldConfig('fillOpacity', 9)
        .setHeaderActions(headerActions(item))
        .build();

      if (shouldRefreshFavoriteData) {
        // don't block the initial render
        setTimeout(async () => {
          const timeRange = sceneGraph.getTimeRange(this).state.value;
          const $data = await buildTimeSeriesGroupByQueryRunner({ queryRunnerParams, timeRange });

          if (hideNoData) {
            this.setupHideNoData($data, gridItemKey);
          }

          timeSeriesPanel.setState({
            $data,
            fieldConfig: {
              defaults: {
                custom: { fillOpacity: 9 },
              },
              overrides: $data.state.queries.map(({ refId, displayNameOverride }, j) => ({
                matcher: { id: FieldMatcherID.byFrameRefID, options: refId },
                properties: [
                  { id: 'displayName', value: displayNameOverride },
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

    (body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
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
