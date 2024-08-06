import { DashboardCursorSync, DataFrame, LoadingState } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneDataProvider,
  SceneDataTransformer,
  SceneObjectBase,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce, isEqual } from 'lodash';
import React from 'react';

import { FavAction } from '../../../domain/actions/FavAction';
import { findSceneObjectByClass } from '../../../helpers/findSceneObjectByClass';
import { FavoritesDataSource } from '../../../infrastructure/favorites/FavoritesDataSource';
import { buildTimeSeriesQueryRunner } from '../../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { SceneEmptyState } from '../../SceneByVariableRepeaterGrid/components/SceneEmptyState/SceneEmptyState';
import { SceneErrorState } from '../../SceneByVariableRepeaterGrid/components/SceneErrorState/SceneErrorState';
import {
  LayoutType,
  SceneLayoutSwitcher,
  SceneLayoutSwitcherState,
} from '../../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneQuickFilter, SceneQuickFilterState } from '../../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { addRefId, addStats, sortSeries } from '../../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from '../../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneGroupByLabels } from './SceneGroupByLabels/SceneGroupByLabels';
import { SceneLabelValuesStatAndTimeseries } from './SceneLabelValuesStatAndTimeseries/SceneLabelValuesStatAndTimeseries';
import { CompareTarget } from './SceneLabelValuesStatAndTimeseries/ui/ComparePanel';

export type GridItemDataWithStats = GridItemData & { stats: Record<string, any> };

interface SceneLabelValuesGridState extends EmbeddedSceneState {
  $data: SceneDataProvider;
  items: GridItemDataWithStats[];
  label: string;
  startColorIndex: number;
  headerActions: (item: GridItemData, items: GridItemData[]) => VizPanelState['headerActions'];
  sortItemsFn: (a: GridItemData, b: GridItemData) => number;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(800px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
export const GRID_AUTO_ROWS = '160px';

const DEFAULT_SORT_ITEMS_FN: SceneLabelValuesGridState['sortItemsFn'] = function (a, b) {
  const aIsFav = FavoritesDataSource.exists(FavAction.buildFavorite(a));
  const bIsFav = FavoritesDataSource.exists(FavAction.buildFavorite(b));

  if (aIsFav && bIsFav) {
    return a.label.localeCompare(b.label);
  }

  if (bIsFav) {
    return +1;
  }

  if (aIsFav) {
    return -1;
  }

  return 0;
};

export class SceneLabelValuesGrid extends SceneObjectBase<SceneLabelValuesGridState> {
  constructor({
    key,
    label,
    startColorIndex,
    headerActions,
  }: {
    key: string;
    label: SceneLabelValuesGridState['label'];
    startColorIndex: SceneLabelValuesGridState['startColorIndex'];
    headerActions: SceneLabelValuesGridState['headerActions'];
  }) {
    super({
      key,
      label,
      startColorIndex,
      items: [],
      $data: new SceneDataTransformer({
        $data: buildTimeSeriesQueryRunner({ groupBy: { label } }),
        transformations: [addRefId, addStats, sortSeries],
      }),
      headerActions,
      sortItemsFn: DEFAULT_SORT_ITEMS_FN,
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_ROWS,
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

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const dataSub = this.subscribeToDataChange();
    const quickFilterSub = this.subscribeToQuickFilterChange();
    const layoutChangeSub = this.subscribeToLayoutChange();

    return () => {
      layoutChangeSub.unsubscribe();
      quickFilterSub.unsubscribe();
      dataSub.unsubscribe();
    };
  }

  subscribeToDataChange() {
    return this.state.$data.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Loading) {
        this.renderGridItems();
      }
    });
  }

  subscribeToQuickFilterChange() {
    const quickFilter = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;

    const onChangeState = (newState: SceneQuickFilterState, prevState?: SceneQuickFilterState) => {
      if (newState.searchText !== prevState?.searchText) {
        this.renderGridItems();
      }
    };

    return quickFilter.subscribeToState(debounce(onChangeState, 250));
  }

  subscribeToLayoutChange() {
    const layoutSwitcher = findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher;
    const body = this.state.body as SceneCSSGridLayout;

    const onChangeState = (newState: SceneLayoutSwitcherState, prevState?: SceneLayoutSwitcherState) => {
      if (newState.layout !== prevState?.layout) {
        body.setState({
          templateColumns: newState.layout === LayoutType.ROWS ? GRID_TEMPLATE_ROWS : GRID_TEMPLATE_COLUMNS,
        });
      }
    };

    onChangeState(layoutSwitcher.state);

    return layoutSwitcher.subscribeToState(onChangeState);
  }

  shouldRenderItems(newItems: SceneLabelValuesGridState['items']) {
    const { items } = this.state;

    if (!newItems.length || items.length !== newItems.length) {
      return true;
    }

    return !isEqual(items, newItems);
  }

  buildItemsData(series: DataFrame[]) {
    const { label, startColorIndex } = this.state;

    const items = series.map(({ fields, meta }, index) => {
      const labelFromSerieLabels = fields[1].labels?.[label];
      const labelFromSerieName = fields[1].name;
      const labelValue = labelFromSerieLabels || labelFromSerieName;

      const allValuesSum = meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;
      const { unit } = fields[1].config;

      return {
        index: startColorIndex + index,
        value: labelValue,
        label: labelValue,
        queryRunnerParams: {
          filters: [{ key: label, operator: '=', value: labelFromSerieLabels || '' }],
        },
        stats: {
          allValuesSum,
          unit,
        },
      };
    });

    return this.filterItems(items).sort(this.state.sortItemsFn);
  }

  renderGridItems(forceRender = false) {
    const { state: loadingState, series, errors } = this.state.$data.state.data!;

    if (loadingState === LoadingState.Loading) {
      return;
    }

    if (loadingState === LoadingState.Error) {
      // TODO: check
      this.renderErrorState(errors?.[0] as Error);
      return;
    }

    const newItems = this.buildItemsData(series);

    if (!forceRender && !this.shouldRenderItems(newItems)) {
      return;
    }

    this.setState({ items: newItems });

    if (!this.state.items.length) {
      this.renderEmptyState();
      return;
    }

    const compare = (findSceneObjectByClass(this, SceneGroupByLabels) as SceneGroupByLabels).getCompare();

    const gridItems = newItems.map((item) => {
      const vizPanel = new SceneLabelValuesStatAndTimeseries({
        item,
        headerActions: this.state.headerActions.bind(null, item, this.state.items),
        compareTargetValue: this.getItemCompareTargetValue(item, compare),
      });

      return new SceneCSSGridItem({
        body: vizPanel,
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
    });
  }

  getItemCompareTargetValue(item: GridItemDataWithStats, compare: Map<CompareTarget, GridItemDataWithStats>) {
    if (compare.get(CompareTarget.BASELINE)?.value === item.value) {
      return CompareTarget.BASELINE;
    }

    if (compare.get(CompareTarget.COMPARISON)?.value === item.value) {
      return CompareTarget.COMPARISON;
    }

    return undefined;
  }

  filterItems(items: SceneLabelValuesGridState['items']) {
    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    const { searchText } = quickFilterScene.state;

    if (!searchText) {
      return items;
    }

    const regexes = searchText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((r) => {
        try {
          return new RegExp(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as RegExp[];

    return items.filter(({ label }) => regexes.some((r) => r.test(label)));
  }

  renderEmptyState() {
    const body = this.state.body as SceneCSSGridLayout;

    body.setState({
      autoRows: '480px',
      children: [
        new SceneCSSGridItem({
          body: new SceneEmptyState({
            message: 'No results',
          }),
        }),
      ],
    });
  }

  renderErrorState(error: Error) {
    const body = this.state.body as SceneCSSGridLayout;

    body.setState({
      autoRows: '480px',
      children: [
        new SceneCSSGridItem({
          body: new SceneErrorState({
            message: error.toString(),
          }),
        }),
      ],
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesGrid>) {
    const { body, $data } = model.useState();
    const $dataState = $data?.useState();

    return $dataState.data?.state === LoadingState.Loading ? <Spinner /> : <body.Component model={body} />;
  }
}
