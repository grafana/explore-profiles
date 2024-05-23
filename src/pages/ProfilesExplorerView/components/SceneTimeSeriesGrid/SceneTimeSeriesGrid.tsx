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
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { EmptyStateScene } from '../../components/EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../../components/SceneLayoutSwitcher';
import { buildProfileQueryRunner } from '../../data/buildProfileQueryRunner';
import { getColorByIndex } from '../../helpers/getColorByIndex';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  items: {
    data: Array<{
      label: string;
      value: string;
      color?: string;
      queryRunnerParams: Record<string, any>;
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
  constructor({ key, items }: { key: string; items?: SceneTimeSeriesGridState['items'] }) {
    const layout = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.layout || SceneLayoutSwitcher.DEFAULT_LAYOUT;

    super({
      key,
      items: {
        data: [],
        isLoading: true,
        error: null,
      },
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns: layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
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
      if (items) {
        this.updateItems(items);
      }
    });
  }

  updateItems(newItems: SceneTimeSeriesGridState['items']) {
    this.setState({ items: newItems });
    this.updateGridItems(newItems);
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
          .setHeaderActions([new SelectAction({ params: actionParams }), new FavAction({ params: actionParams })])
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

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneCSSGridLayout).setState({
      templateColumns: newLayout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  onFilterChange(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const filteredData = trimmedSearchText
      ? this.state.items.data.filter(({ label }) => label.includes(trimmedSearchText))
      : this.state.items.data;

    this.updateGridItems({
      data: filteredData,
      isLoading: false,
      error: null,
    });
  }

  onHideNoDataChange(newHideNoData: boolean) {
    this.setState({ hideNoData: newHideNoData });
    this.updateGridItems(this.state.items);
  }

  static Component({ model }: SceneComponentProps<SceneTimeSeriesGrid>) {
    const { body, items } = model.useState();

    return items.isLoading ? <Spinner /> : <body.Component model={body} />;
  }
}
