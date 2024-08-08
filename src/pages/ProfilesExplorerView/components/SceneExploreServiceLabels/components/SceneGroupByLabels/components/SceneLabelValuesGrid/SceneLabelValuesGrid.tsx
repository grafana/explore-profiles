import { DashboardCursorSync, DataFrame, LoadingState } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneDataProvider,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce, isEqual } from 'lodash';
import React from 'react';

import { findSceneObjectByClass } from '../../../../../../helpers/findSceneObjectByClass';
import { getSceneVariableValue } from '../../../../../../helpers/getSceneVariableValue';
import { getSeriesStatsValue } from '../../../../../../helpers/getSeriesStatsValue';
import { buildTimeSeriesQueryRunner } from '../../../../../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { SceneEmptyState } from '../../../../../SceneByVariableRepeaterGrid/components/SceneEmptyState/SceneEmptyState';
import { SceneErrorState } from '../../../../../SceneByVariableRepeaterGrid/components/SceneErrorState/SceneErrorState';
import {
  LayoutType,
  SceneLayoutSwitcher,
  SceneLayoutSwitcherState,
} from '../../../../../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import {
  SceneNoDataSwitcher,
  SceneNoDataSwitcherState,
} from '../../../../../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { PanelType } from '../../../../../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import {
  SceneQuickFilter,
  SceneQuickFilterState,
} from '../../../../../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { sortFavGridItems } from '../../../../../SceneByVariableRepeaterGrid/domain/sortFavGridItems';
import { addRefId, addStats } from '../../../../../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from '../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventDataReceived } from '../../../../../SceneLabelValuesTimeseries/domain/events/EventDataReceived';
import { SceneGroupByLabels } from '../../SceneGroupByLabels';
import { CompareTarget } from './components/SceneComparePanel/ui/ComparePanel';
import { SceneLabelValuePanel } from './components/SceneLabelValuePanel';

export type GridItemDataWithStats = GridItemData & {
  stats: {
    allValuesSum: number;
    unit: string;
  };
};

export interface SceneLabelValuesGridState extends EmbeddedSceneState {
  $data: SceneDataProvider;
  isLoading: boolean;
  items: GridItemDataWithStats[];
  label: string;
  startColorIndex: number;
  headerActions: (item: GridItemData, items: GridItemData[]) => VizPanelState['headerActions'];
  sortItemsFn: (a: GridItemDataWithStats, b: GridItemDataWithStats) => number;
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(800px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
export const GRID_AUTO_ROWS = '160px';

export class SceneLabelValuesGrid extends SceneObjectBase<SceneLabelValuesGridState> {
  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.index}-${item.value}`;
  }

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
      isLoading: true,
      $data: new SceneDataTransformer({
        $data: buildTimeSeriesQueryRunner({ groupBy: { label } }),
        transformations: [addRefId, addStats],
      }),
      hideNoData: false,
      headerActions,
      sortItemsFn: sortFavGridItems,
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
    this.fetchData();

    const refreshSub = this.subscribeToRefreshClick();
    const quickFilterSub = this.subscribeToQuickFilterChange();
    const layoutChangeSub = this.subscribeToLayoutChange();
    const hideNoDataSub = this.subscribeToHideNoDataChange();

    return () => {
      hideNoDataSub.unsubscribe();
      layoutChangeSub.unsubscribe();
      quickFilterSub.unsubscribe();
      refreshSub.unsubscribe();
    };
  }

  fetchData() {
    this.setState({ isLoading: true });

    const dataSub = this.state.$data.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Loading) {
        dataSub.unsubscribe();

        this.renderGridItems();

        this.setState({ isLoading: false });
      }
    });
  }

  subscribeToRefreshClick() {
    const onClickRefresh = () => {
      this.fetchData();
    };

    // start of hack, for a better UX: we disable the variable "refresh" option and we allow the user to reload the list only by clicking on the "Refresh" button
    // if we don't do this, every time the time range changes (even with auto-refresh on),
    // all the timeseries present on the screen would be re-created, resulting in blinking and a poor UX
    const refreshButton = document.querySelector(
      '[data-testid="data-testid RefreshPicker run button"]'
    ) as HTMLButtonElement;

    if (!refreshButton) {
      console.error('SceneByVariableRepeaterGrid: Refresh button not found! The list of items will never be updated.');
    }

    refreshButton?.addEventListener('click', onClickRefresh);
    refreshButton?.setAttribute('title', 'Click to completely refresh all the panels present on the screen');
    // end of hack

    return {
      unsubscribe() {
        refreshButton?.removeAttribute('title');
        refreshButton?.removeEventListener('click', onClickRefresh);
      },
    };
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

  subscribeToHideNoDataChange() {
    const noDataSwitcher = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    const onChangeState = (newState: SceneNoDataSwitcherState, prevState?: SceneNoDataSwitcherState) => {
      if (newState.hideNoData !== prevState?.hideNoData) {
        this.setState({ hideNoData: newState.hideNoData === 'on' });

        // we force render because this.state.items certainly have not changed but we want to update the UI panels anyway
        this.renderGridItems(true);
      }
    };

    onChangeState(noDataSwitcher.state);

    return noDataSwitcher.subscribeToState(onChangeState);
  }

  shouldRenderItems(newItems: SceneLabelValuesGridState['items']) {
    const { items } = this.state;

    if (!newItems.length || items.length !== newItems.length) {
      return true;
    }

    return !isEqual(items, newItems);
  }

  buildItemsData(series: DataFrame[]) {
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');

    const { label, startColorIndex, sortItemsFn } = this.state;

    const items = series
      .sort((s1, s2) => (getSeriesStatsValue(s2, 'allValuesSum') || 0) - (getSeriesStatsValue(s1, 'allValuesSum') || 0))
      .map((s, index) => {
        const metricField = s.fields[1];
        const labelFromSerieLabels = metricField.labels?.[label];
        const labelFromSerieName = metricField.name;
        const labelValue = labelFromSerieLabels || labelFromSerieName;

        return {
          index: startColorIndex + index,
          value: labelValue,
          label: labelValue,
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            filters: [{ key: label, operator: '=', value: labelFromSerieLabels || '' }],
          },
          panelType: PanelType.TIMESERIES,
          stats: {
            allValuesSum: getSeriesStatsValue(s, 'allValuesSum') || 0,
            unit: metricField.config.unit as string,
          },
        };
      });

    return this.filterItems(items).sort(sortItemsFn);
  }

  renderGridItems(forceRender = false) {
    if (!this.state.$data.state.data) {
      return;
    }

    const { state: loadingState, series, errors } = this.state.$data.state.data;

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
      return new SceneCSSGridItem({
        key: SceneLabelValuesGrid.buildGridItemKey(item),
        body: this.buildVizPanel(item, compare),
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
    });
  }

  buildVizPanel(item: GridItemDataWithStats, compare: Map<CompareTarget, GridItemDataWithStats>) {
    const vizPanel = new SceneLabelValuePanel({
      item,
      headerActions: this.state.headerActions.bind(null, item, this.state.items),
      compareTargetValue: this.getItemCompareTargetValue(item, compare),
    });

    const sub = vizPanel.subscribeToEvent(EventDataReceived, (event) => {
      // we might have to consider if we update the item.stats here (will impact sorting if we don't do it)

      if (this.state.hideNoData && !event.payload.series.length) {
        const gridItem = sceneGraph.getAncestor(vizPanel, SceneCSSGridItem);
        const { key: gridItemKey } = gridItem.state;
        const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);

        const filteredChildren = grid.state.children.filter((c) => c.state.key !== gridItemKey);

        if (!filteredChildren.length) {
          this.renderEmptyState();
        } else {
          grid.setState({ children: filteredChildren });
        }
      }
    });

    vizPanel.addActivationHandler(() => {
      return () => {
        sub.unsubscribe();
      };
    });

    return vizPanel;
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
    const { body, isLoading } = model.useState();

    return isLoading ? <Spinner /> : <body.Component model={body} />;
  }
}
