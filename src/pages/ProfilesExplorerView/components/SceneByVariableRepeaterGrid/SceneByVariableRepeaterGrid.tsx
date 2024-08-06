import { DashboardCursorSync, LoadingState, VariableRefresh } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  QueryVariable,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableValueOption,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import { debounce, isEqual } from 'lodash';
import React from 'react';

import { FavAction } from '../../domain/actions/FavAction';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { FavoritesDataSource } from '../../infrastructure/favorites/FavoritesDataSource';
import { SceneLabelValuesBarGauge } from '../SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../SceneLabelValuesTimeseries';
import { SceneEmptyState } from './components/SceneEmptyState/SceneEmptyState';
import { SceneErrorState } from './components/SceneErrorState/SceneErrorState';
import { LayoutType, SceneLayoutSwitcher, SceneLayoutSwitcherState } from './components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher, SceneNoDataSwitcherState } from './components/SceneNoDataSwitcher';
import { PanelType, ScenePanelTypeSwitcher } from './components/ScenePanelTypeSwitcher';
import { SceneQuickFilter, SceneQuickFilterState } from './components/SceneQuickFilter';
import { GridItemData } from './types/GridItemData';

interface SceneByVariableRepeaterGridState extends EmbeddedSceneState {
  variableName: string;
  items: GridItemData[];
  headerActions: (item: GridItemData, items: GridItemData[]) => VizPanelState['headerActions'];
  mapOptionToItem: (
    option: VariableValueOption,
    index: number,
    variablesValues: Record<string, string>
  ) => GridItemData | null;
  sortItemsFn: (a: GridItemData, b: GridItemData) => number;
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

const DEFAULT_SORT_ITEMS_FN: SceneByVariableRepeaterGridState['sortItemsFn'] = function (a, b) {
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

export class SceneByVariableRepeaterGrid extends SceneObjectBase<SceneByVariableRepeaterGridState> {
  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.index}-${item.value}`;
  }

  static getGridColumnsTemplate(layout: LayoutType) {
    return layout === LayoutType.ROWS ? GRID_TEMPLATE_ROWS : GRID_TEMPLATE_COLUMNS;
  }

  constructor({
    key,
    variableName,
    headerActions,
    mapOptionToItem,
    sortItemsFn,
  }: {
    key: string;
    variableName: SceneByVariableRepeaterGridState['variableName'];
    headerActions: SceneByVariableRepeaterGridState['headerActions'];
    mapOptionToItem: SceneByVariableRepeaterGridState['mapOptionToItem'];
    sortItemsFn?: SceneByVariableRepeaterGridState['sortItemsFn'];
  }) {
    super({
      key,
      variableName,
      items: [],
      headerActions,
      mapOptionToItem,
      sortItemsFn: sortItemsFn || DEFAULT_SORT_ITEMS_FN,
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns: SceneByVariableRepeaterGrid.getGridColumnsTemplate(SceneLayoutSwitcher.DEFAULT_LAYOUT),
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
    // here we try to emulate VariableDependencyConfig.onVariableUpdateCompleted
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable & { update: () => void };

    const variableSub = variable.subscribeToState((newState, prevState) => {
      if (!newState.loading && prevState.loading) {
        this.renderGridItems();
      }
    });

    // if the variable is inactive, the data source will not fetch the options
    // so we force an update here to be sure we have the latest values
    variable.update();

    const refreshSub = this.subscribeToRefreshClick();
    const quickFilterSub = this.subscribeToQuickFilterChange();
    const layoutChangeSub = this.subscribeToLayoutChange();
    const hideNoDataSub = this.subscribeToHideNoDataChange();

    return () => {
      hideNoDataSub.unsubscribe();
      layoutChangeSub.unsubscribe();
      quickFilterSub.unsubscribe();
      refreshSub.unsubscribe();

      variableSub.unsubscribe();
    };
  }

  subscribeToRefreshClick() {
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable & { update: () => void };
    const originalRefresh = variable.state.refresh;

    variable.setState({ refresh: VariableRefresh.never });

    const onClickRefresh = () => {
      variable.update();
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
        variable.setState({ refresh: originalRefresh });
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
          templateColumns: SceneByVariableRepeaterGrid.getGridColumnsTemplate(newState.layout),
        });
      }
    };

    onChangeState(layoutSwitcher.state);

    return layoutSwitcher.subscribeToState(onChangeState);
  }

  subscribeToHideNoDataChange() {
    const noDataSwitcher = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    if (!noDataSwitcher.isActive) {
      this.setState({ hideNoData: false });

      return {
        unsubscribe: noOp,
      };
    }

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

  buildItemsData(variable: QueryVariable) {
    const { mapOptionToItem } = this.state;

    const variableValues = {
      serviceName: getSceneVariableValue(this, 'serviceName'),
      profileMetricId: getSceneVariableValue(this, 'profileMetricId'),
      panelType: (findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher).state.panelType,
    };

    const items = variable.state.options
      .map((option, i) => mapOptionToItem(option, i, variableValues))
      .filter(Boolean) as GridItemData[];

    return this.filterItems(items).sort(this.state.sortItemsFn);
  }

  shouldRenderItems(newItems: SceneByVariableRepeaterGridState['items']) {
    const { items } = this.state;

    if (!newItems.length || items.length !== newItems.length) {
      return true;
    }

    return !isEqual(items, newItems);
  }

  renderGridItems(forceRender = false) {
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable;

    if (variable.state.loading) {
      return;
    }

    if (variable.state.error) {
      this.renderErrorState(variable.state.error);
      return;
    }

    const newItems = this.buildItemsData(variable);

    if (!forceRender && !this.shouldRenderItems(newItems)) {
      return;
    }

    this.setState({ items: newItems });

    if (!this.state.items.length) {
      this.renderEmptyState();
      return;
    }

    const gridItems = this.state.items.map((item) => {
      const vizPanel = this.buildVizPanel(item);

      if (this.state.hideNoData) {
        this.setupHideNoData(vizPanel);
      }

      return new SceneCSSGridItem({
        key: SceneByVariableRepeaterGrid.buildGridItemKey(item),
        body: vizPanel,
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
    });
  }

  buildVizPanel(item: GridItemData) {
    switch (item.panelType) {
      case PanelType.BARGAUGE:
        return new SceneLabelValuesBarGauge({
          item,
          headerActions: this.state.headerActions.bind(null, item, this.state.items),
        });

      case PanelType.TIMESERIES:
      default:
        return new SceneLabelValuesTimeseries({
          item,
          headerActions: this.state.headerActions.bind(null, item, this.state.items),
        });
    }
  }

  setupHideNoData(vizPanel: SceneLabelValuesTimeseries | SceneLabelValuesBarGauge) {
    const sub = (vizPanel.state.body.state.$data as SceneQueryRunner)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || state.data.series.length > 0) {
        return;
      }

      const gridItem = sceneGraph.getAncestor(vizPanel, SceneCSSGridItem);
      const { key: gridItemKey } = gridItem.state;
      const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);

      const filteredChildren = grid.state.children.filter((c) => c.state.key !== gridItemKey);

      if (!filteredChildren.length) {
        this.renderEmptyState();
      } else {
        grid.setState({ children: filteredChildren });
      }
    });

    vizPanel.addActivationHandler(() => {
      return () => {
        sub.unsubscribe();
      };
    });
  }

  filterItems(items: SceneByVariableRepeaterGridState['items']) {
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

  static Component({ model }: SceneComponentProps<SceneByVariableRepeaterGrid>) {
    const { body, variableName } = model.useState();
    const { loading } = (sceneGraph.lookupVariable(variableName, model) as QueryVariable)?.useState();

    return loading ? <Spinner /> : <body.Component model={body} />;
  }
}
