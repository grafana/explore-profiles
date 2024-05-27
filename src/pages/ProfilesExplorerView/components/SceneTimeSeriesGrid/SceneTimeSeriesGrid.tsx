import { DashboardCursorSync, LoadingState } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableDependencyConfig,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';

import { EmptyStateScene } from '../../components/EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../../components/SceneLayoutSwitcher';
import { buildProfileQueryRunner } from '../../data/buildProfileQueryRunner';
import { getDataSourceError } from '../../data/getDataSourceError';
import { DataSourceDef } from '../../data/pyroscope-data-source';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { SceneNoDataSwitcher } from '../SceneNoDataSwitcher';
import { SceneQuickFilter } from '../SceneQuickFilter';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  headerActions: (params: Record<string, any>) => VizPanelState['headerActions'];
  dataSource?: DataSourceDef;
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
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneTimeSeriesGrid extends SceneObjectBase<SceneTimeSeriesGridState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      if (
        (sceneGraph.findObject(this, (o) => o instanceof SceneNoDataSwitcher) as SceneNoDataSwitcher)?.state?.hideNoData
      ) {
        // if we don't do this, we get stuck with the previous grid that might not include the items that had no data before
        // but that now have data after the variable update
        this.updateGridItems(this.state.items);
      }
    },
  });

  static DEFAULT_LAYOUT: LayoutType.GRID;

  constructor({
    key,
    headerActions,
    items,
    dataSource,
  }: {
    key: string;
    items?: SceneTimeSeriesGridState['items'];
    headerActions: SceneTimeSeriesGridState['headerActions'];
    dataSource?: SceneTimeSeriesGridState['dataSource'];
  }) {
    super({
      key,
      dataSource,
      items: items || {
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
    });

    this.addActivationHandler(() => {
      const quickFilterSub = this.initQuickFilterChange();
      const layoutChangeSub = this.initLayoutChange();
      const hideNoDataSub = this.initHideNoDataChange();

      const subs = [quickFilterSub, layoutChangeSub, hideNoDataSub];

      if (items) {
        this.updateItems(items);
      }

      if (dataSource) {
        subs.push(this.loadItems(dataSource));
      }

      return () => {
        subs.forEach((sub) => sub.unsubscribe());
      };
    });
  }

  loadItems(dataSource: DataSourceDef) {
    const queryRunner = new SceneQueryRunner({
      datasource: dataSource,
      queries: [
        {
          refId: `${dataSource.type}-${this.state.key}`,
          queryType: 'metrics',
        },
      ],
    });

    const sub = queryRunner.subscribeToState((newState) => {
      if (!newState.data) {
        return;
      }

      const { state, series, errors } = newState.data;

      if (state === LoadingState.Error) {
        sub.unsubscribe();

        this.updateItems({
          data: [],
          isLoading: false,
          error: getDataSourceError(errors),
        });

        return;
      }

      if (state === LoadingState.Done) {
        sub.unsubscribe();

        const { name, values } = series[0].fields[0];

        this.updateItems({
          data: values.map((value) => ({
            ...value,
            queryRunnerParams: {
              [name]: value.value,
            },
          })),
          isLoading: false,
          error: null,
        });
      }
    });

    queryRunner.runQueries();

    return sub;
  }

  initQuickFilterChange() {
    const quickFilterScene = sceneGraph.findObject(this, (o) => o instanceof SceneQuickFilter) as SceneQuickFilter;

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
    const layoutSwitcherScene = sceneGraph.findObject(
      this,
      (o) => o instanceof SceneLayoutSwitcher
    ) as SceneLayoutSwitcher;

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
    const noDataSwitcherScene = sceneGraph.findObject(
      this,
      (o) => o instanceof SceneNoDataSwitcher
    ) as SceneNoDataSwitcher;

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

    const quickFilterScene = sceneGraph.findObject(this, (o) => o instanceof SceneQuickFilter) as SceneQuickFilter;
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
      const actionParams = { ...item.queryRunnerParams, color };

      const data = buildProfileQueryRunner(item.queryRunnerParams);

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
