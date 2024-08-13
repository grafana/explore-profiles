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
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import { debounce, isEqual } from 'lodash';
import React from 'react';

import { getSceneVariableValue } from '../../../helpers/getSceneVariableValue';
import { SceneEmptyState } from '../../SceneByVariableRepeaterGrid/components/SceneEmptyState/SceneEmptyState';
import { SceneErrorState } from '../../SceneByVariableRepeaterGrid/components/SceneErrorState/SceneErrorState';
import { LayoutType, SceneLayoutSwitcher } from '../../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { PanelType, ScenePanelTypeSwitcher } from '../../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { sortFavGridItems } from '../../SceneByVariableRepeaterGrid/domain/sortFavGridItems';
import { GridItemData } from '../../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneLabelValuesBarGauge } from '../../SceneLabelValuesBarGauge';
import { SceneLabelValueStat } from '../../SceneLabelValueStat';
import { SceneLabelValuesTimeseries } from '../../SceneLabelValuesTimeseries';

interface SceneLabelValuesGridState extends EmbeddedSceneState {
  items: GridItemData[];
  headerActions: (item: GridItemData, items: GridItemData[]) => VizPanelState['headerActions'];
  sortItemsFn: (a: GridItemData, b: GridItemData) => number;
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';

const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';
const GRID_AUTO_ROWS_SMALL = '76px';

export class SceneLabelValuesGrid extends SceneObjectBase<SceneLabelValuesGridState> {
  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.index}-${item.value}`;
  }

  static getGridColumnsTemplate(layout: LayoutType) {
    return layout === LayoutType.ROWS ? GRID_TEMPLATE_ROWS : GRID_TEMPLATE_COLUMNS;
  }

  constructor({
    key,
    headerActions,
    sortItemsFn,
  }: {
    key: string;
    headerActions: SceneLabelValuesGridState['headerActions'];
    sortItemsFn?: SceneLabelValuesGridState['sortItemsFn'];
  }) {
    super({
      key,
      items: [],
      headerActions,
      sortItemsFn: sortItemsFn || sortFavGridItems,
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns: SceneLabelValuesGrid.getGridColumnsTemplate(SceneLayoutSwitcher.DEFAULT_LAYOUT),
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  onActivate() {
    // here we try to emulate VariableDependencyConfig.onVariableUpdateCompleted
    const variable = sceneGraph.lookupVariable('groupBy', this) as QueryVariable & { update: () => void };

    const variableSub = variable.subscribeToState((newState, prevState) => {
      if (!newState.loading && prevState.loading) {
        this.renderGridItems();
      }
    });

    // the "groupBy" variable data source will not fetch values if the variable is inactive
    // (see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts)
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
    const variable = sceneGraph.lookupVariable('groupBy', this) as QueryVariable & { update: () => void };
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
      console.error('SceneLabelValuesGrid: Refresh button not found! The list of items will never be updated.');
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
    const quickFilter = sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter);

    const onChangeState = (newState: typeof quickFilter.state, prevState?: typeof quickFilter.state) => {
      if (newState.searchText !== prevState?.searchText) {
        this.renderGridItems();
      }
    };

    return quickFilter.subscribeToState(debounce(onChangeState, 250));
  }

  subscribeToLayoutChange() {
    const layoutSwitcher = sceneGraph.findByKeyAndType(this, 'layout-switcher', SceneLayoutSwitcher);

    const body = this.state.body as SceneCSSGridLayout;

    const onChangeState = (newState: typeof layoutSwitcher.state, prevState?: typeof layoutSwitcher.state) => {
      if (newState.layout !== prevState?.layout) {
        body.setState({
          templateColumns: SceneLabelValuesGrid.getGridColumnsTemplate(newState.layout),
        });
      }
    };

    onChangeState(layoutSwitcher.state);

    return layoutSwitcher.subscribeToState(onChangeState);
  }

  subscribeToHideNoDataChange() {
    const noDataSwitcher = sceneGraph.findByKeyAndType(this, 'no-data-switcher', SceneNoDataSwitcher);

    if (!noDataSwitcher.isActive) {
      this.setState({ hideNoData: false });

      return {
        unsubscribe: noOp,
      };
    }

    const onChangeState = (newState: typeof noDataSwitcher.state, prevState?: typeof noDataSwitcher.state) => {
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
    const { value: variableValue, options } = variable.state;

    const currentOption = options
      .filter((o) => o.value !== 'all')
      .find((o) => variableValue === JSON.parse(o.value as string).value);

    if (!currentOption) {
      console.error('Cannot find the "%s" groupBy value among all the variable option!', variableValue);
      return [];
    }

    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const panelTypeFromSwitcher = sceneGraph.findByKeyAndType(this, 'panel-type-switcher', ScenePanelTypeSwitcher).state
      .panelType;

    const panelType = panelTypeFromSwitcher === PanelType.BARGAUGE ? PanelType.STATS : panelTypeFromSwitcher;

    const items = JSON.parse(currentOption.value as string).groupBy.values.map((value: string, index: number) => {
      return {
        index,
        value: value,
        label: value,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          filters: [{ key: variableValue, operator: '=', value }],
        },
        panelType,
      };
    });

    return this.filterItems(items).sort(this.state.sortItemsFn);
  }

  shouldRenderItems(newItems: SceneLabelValuesGridState['items']) {
    const { items } = this.state;

    if (!newItems.length || items.length !== newItems.length) {
      return true;
    }

    return !isEqual(items, newItems);
  }

  renderGridItems(forceRender = false) {
    const variable = sceneGraph.lookupVariable('groupBy', this) as QueryVariable;

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
        key: SceneLabelValuesGrid.buildGridItemKey(item),
        body: vizPanel,
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: this.getAutoRows(), // required to have the correct grid items height
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

      case PanelType.STATS:
        return new SceneLabelValueStat({
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

  setupHideNoData(vizPanel: SceneLabelValuesTimeseries | SceneLabelValuesBarGauge | SceneLabelValueStat) {
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

  getAutoRows() {
    const { panelType } = sceneGraph.findByKeyAndType(this, 'panel-type-switcher', ScenePanelTypeSwitcher).state;
    return panelType === PanelType.BARGAUGE ? GRID_AUTO_ROWS_SMALL : GRID_AUTO_ROWS;
  }

  filterItems(items: SceneLabelValuesGridState['items']) {
    const quickFilterScene = sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter);
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
    const { body } = model.useState();
    const { loading } = (sceneGraph.lookupVariable('groupBy', model) as QueryVariable)?.useState();

    return loading ? <Spinner /> : <body.Component model={body} />;
  }
}
