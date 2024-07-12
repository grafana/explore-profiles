import { DashboardCursorSync, DataFrame, FieldMatcherID, LoadingState, VariableRefresh } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  QueryVariable,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableDependencyConfig,
  VariableValueOption,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { GraphGradientMode, Spinner } from '@grafana/ui';
import { debounce, merge } from 'lodash';
import React from 'react';
import { map, Observable } from 'rxjs';

import { FavAction } from '../../actions/FavAction';
import { FavoritesDataSource } from '../../data/favorites/FavoritesDataSource';
import { LabelsDataSource } from '../../data/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { ErrorStateScene } from '../ErrorState/ErrorStateScene';
import { GridItemData } from './GridItemData';
import { LayoutType, SceneLayoutSwitcher } from './SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from './SceneNoDataSwitcher';
import { SceneQuickFilter } from './SceneQuickFilter';

interface SceneByVariableRepeaterGridState extends EmbeddedSceneState {
  variableName: string;
  dependentVariableNames: string[];
  items: GridItemData[];
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
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
  static DEFAULT_LAYOUT = LayoutType.GRID;

  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.index}-${item.value}`;
  }

  static limitNumberOfSeries = () => (source: Observable<DataFrame[]>) =>
    source.pipe(
      map((data: DataFrame[]) => {
        const totalSeriesCount = data.length;

        return data.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES).map((d, i) =>
          merge(d, {
            // adding unique "refId" and "totalSeriesCount" for overrides (see setupOverrides() below)
            refId: `${d.refId}-${i}`,
            meta: {
              stats: [{ displayName: 'totalSeriesCount', value: totalSeriesCount }],
            },
          })
        );
      })
    );

  protected _variableDependency: VariableDependencyConfig<SceneByVariableRepeaterGridState> =
    new VariableDependencyConfig(this, {
      variableNames: this.state.dependentVariableNames,
      onReferencedVariableValueChanged: () => {
        this.renderGridItems();
      },
    });

  constructor({
    key,
    variableName,
    dependentVariableNames,
    headerActions,
    sortItemsFn,
  }: {
    key: string;
    variableName: SceneByVariableRepeaterGridState['variableName'];
    dependentVariableNames: SceneByVariableRepeaterGridState['dependentVariableNames'];
    headerActions: SceneByVariableRepeaterGridState['headerActions'];
    sortItemsFn?: SceneByVariableRepeaterGridState['sortItemsFn'];
  }) {
    super({
      key,
      variableName,
      dependentVariableNames,
      items: [],
      headerActions,
      sortItemsFn: sortItemsFn || DEFAULT_SORT_ITEMS_FN,
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns: SceneByVariableRepeaterGrid.getGridColumnsTemplate(SceneByVariableRepeaterGrid.DEFAULT_LAYOUT),
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
      if (!newState.loading) {
        if (prevState.loading) {
          this.renderGridItems();
          return;
        }

        // TODO: create a dedicated variable instead of looking at the groupBy value?
        if (variable.state.name === 'groupBy' && newState.value !== prevState.value) {
          this.renderGridItems();
          return;
        }
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

  static getGridColumnsTemplate(layout: LayoutType) {
    return layout === LayoutType.ROWS ? GRID_TEMPLATE_ROWS : GRID_TEMPLATE_COLUMNS;
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
    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;

    const onChangeState = (newState: typeof quickFilterScene.state, prevState?: typeof quickFilterScene.state) => {
      if (newState.searchText !== prevState?.searchText) {
        this.renderGridItems();
      }
    };

    return quickFilterScene.subscribeToState(debounce(onChangeState, 250));
  }

  subscribeToLayoutChange() {
    const layoutSwitcherScene = findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher;

    const body = this.state.body as SceneCSSGridLayout;

    const onChangeState = (
      newState: typeof layoutSwitcherScene.state,
      prevState?: typeof layoutSwitcherScene.state
    ) => {
      if (newState.layout !== prevState?.layout) {
        body.setState({
          templateColumns: SceneByVariableRepeaterGrid.getGridColumnsTemplate(newState.layout),
        });
      }
    };

    onChangeState(layoutSwitcherScene.state);

    return layoutSwitcherScene.subscribeToState(onChangeState);
  }

  subscribeToHideNoDataChange() {
    const noDataSwitcherScene = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    const onChangeState = (
      newState: typeof noDataSwitcherScene.state,
      prevState?: typeof noDataSwitcherScene.state
    ) => {
      if (newState.hideNoData !== prevState?.hideNoData) {
        this.setState({ hideNoData: newState.hideNoData === 'on' });
        this.renderGridItems();
      }
    };

    onChangeState(noDataSwitcherScene.state);

    return noDataSwitcherScene.subscribeToState(onChangeState);
  }

  getCurrentOptions(variable: QueryVariable): VariableValueOption[] {
    const { options, value: variableValue } = variable.state;

    if (this.state.variableName !== 'groupBy') {
      return options;
    }

    const groupByOptions = options.filter(({ value }) => value !== 'all');

    if (variableValue === 'all') {
      return groupByOptions.map(({ value }) => {
        const parsedValue = JSON.parse(value as string);

        if (parsedValue.groupBy.values.length > 1) {
          return {
            // remove the count in the parentheses, because it's not updated dynamically when applying filters
            label: parsedValue.value,
            value,
          };
        }

        // we need to add a filter for the "Flame graph", "Add to filters" and "Compare" actions to work
        return {
          // remove the count in the parentheses, because it's not updated dynamically when applying filters
          label: parsedValue.value,
          value: JSON.stringify({
            ...parsedValue,
            filters: [
              {
                key: parsedValue.groupBy.label,
                operator: '=',
                value: parsedValue.groupBy.values[0],
              },
            ],
          }),
        };
      });
    }

    const currentOption = groupByOptions.find((o) => variableValue === JSON.parse(o.value as string).value);

    if (!currentOption) {
      return [];
    }

    return JSON.parse(currentOption.value as string).groupBy.values.map((labelValue: string) => {
      const valueObject = {
        value: labelValue,
        // we need to add a filter for the "Flame graph", "Add to filters" and "Compare" actions to work
        filters: [
          {
            key: variableValue,
            operator: '=',
            value: labelValue,
          },
        ],
      };

      return {
        label: labelValue,
        value: JSON.stringify(valueObject),
      };
    });
  }

  buildItemsData(variable: QueryVariable) {
    const { name: variableName } = variable.state;
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');

    const items = this.getCurrentOptions(variable).map((option, i) => {
      try {
        const parsedValue = JSON.parse(option.value as string);
        const {
          // see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts
          value,
          groupBy,
          filters,
          // see src/pages/ProfilesExplorerView/data/favorites/FavoritesDataSource.ts
          index,
          queryRunnerParams,
        } = parsedValue;

        return {
          index: index !== undefined ? index : i,
          value: value as string,
          label: option.label,
          queryRunnerParams: queryRunnerParams || {
            serviceName,
            profileMetricId,
            groupBy,
            filters: filters || [],
          },
        };
      } catch {
        return {
          index: i,
          value: option.value as string,
          label: option.label,
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            [variableName as keyof GridItemData['queryRunnerParams']]: option.value,
          },
        };
      }
    });

    return this.filterItems(items).sort(this.state.sortItemsFn);
  }

  // TODO: prevent too many re-renders
  renderGridItems() {
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable;

    if (variable.state.error) {
      this.renderErrorState(variable.state.error);
      return;
    }

    this.setState({ items: this.buildItemsData(variable) });

    if (!this.state.items.length) {
      this.renderEmptyState();
      return;
    }

    const { headerActions } = this.state;

    const gridItems = this.state.items.map((item) => {
      const gridItemKey = SceneByVariableRepeaterGrid.buildGridItemKey(item);
      const { queryRunnerParams } = item;

      const data = new SceneDataTransformer({
        $data: buildTimeSeriesQueryRunner(queryRunnerParams),
        transformations: [SceneByVariableRepeaterGrid.limitNumberOfSeries],
      });

      const timeSeriesPanel = PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(data)
        .setHeaderActions(headerActions(item))
        .build();

      if (this.state.hideNoData) {
        this.setupHideNoData(timeSeriesPanel);
      }

      this.setupOverrides(timeSeriesPanel, item);

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: timeSeriesPanel,
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
    });
  }

  setupOverrides(timeSeriesPanel: VizPanel, item: GridItemData) {
    const sub = (timeSeriesPanel.state.$data as SceneDataTransformer)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || !state.data.series.length) {
        return;
      }

      const groupByLabel = item.queryRunnerParams.groupBy?.label;

      const { series } = state.data;
      const totalSeriesCount = series[0].meta!.stats![0].value; // see limitNumberOfSeries() above
      const hasTooManySeries = totalSeriesCount > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES;

      timeSeriesPanel.setState({
        description: hasTooManySeries
          ? `The number of series on this panel has been reduced from ${totalSeriesCount} to ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} to preserve readability. Click on the "Expand panel" or the "Values distributions" icon to see all the values.`
          : undefined,
        fieldConfig: {
          defaults: {
            min: 0,
            custom: {
              fillOpacity: series.length === LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES ? 0 : 9,
              gradientMode: series.length === 1 ? GraphGradientMode.None : GraphGradientMode.Opacity,
            },
          },
          overrides: series.map((serie, i) => ({
            matcher: { id: FieldMatcherID.byFrameRefID, options: serie.refId },
            properties: [
              {
                id: 'displayName',
                value: groupByLabel ? serie.fields[1].labels?.[groupByLabel] || '?' : serie.fields[1].name,
              },
              {
                id: 'color',
                value: { mode: 'fixed', fixedColor: getColorByIndex(item.index + i) },
              },
            ],
          })),
        },
      });
    });

    timeSeriesPanel.addActivationHandler(() => {
      return () => {
        sub.unsubscribe();
      };
    });
  }

  setupHideNoData(timeSeriesPanel: VizPanel) {
    const sub = (timeSeriesPanel.state.$data as SceneQueryRunner)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || state.data.series.length > 0) {
        return;
      }

      const gridItem = sceneGraph.getAncestor(timeSeriesPanel, SceneCSSGridItem);
      const { key: gridItemKey } = gridItem.state;
      const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);

      const filteredChildren = grid.state.children.filter((c) => c.state.key !== gridItemKey);

      if (!filteredChildren.length) {
        this.renderEmptyState();
      } else {
        grid.setState({ children: filteredChildren });
      }
    });

    timeSeriesPanel.addActivationHandler(() => {
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
          body: new EmptyStateScene({
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
          body: new ErrorStateScene({
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
