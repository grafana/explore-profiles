import { DashboardCursorSync, FieldMatcherID, LoadingState, VariableRefresh } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  QueryVariable,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableDependencyConfig,
  VariableValueOption,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';

import { buildTimeSeriesGroupByQueryRunner } from '../../data/timeseries/buildTimeSeriesGroupByQueryRunner';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { ProfileMetricVariable } from '../../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../variables/ServiceNameVariable';
import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { ErrorStateScene } from '../ErrorState/ErrorStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneNoDataSwitcher';
import { SceneQuickFilter } from '../SceneQuickFilter';
import { GridItemData } from './GridItemData';

interface SceneByVariableRepeaterGridState extends EmbeddedSceneState {
  variableName: string;
  dependentVariableNames: string[];
  items: GridItemData[];
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneByVariableRepeaterGrid extends SceneObjectBase<SceneByVariableRepeaterGridState> {
  static DEFAULT_LAYOUT = LayoutType.GRID;

  static buildGridItemKey(item: GridItemData) {
    return `grid-item-${item.index}-${item.value}`;
  }

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
  }: {
    key: string;
    variableName: SceneByVariableRepeaterGridState['variableName'];
    dependentVariableNames: SceneByVariableRepeaterGridState['dependentVariableNames'];
    headerActions: SceneByVariableRepeaterGridState['headerActions'];
  }) {
    super({
      key,
      variableName,
      dependentVariableNames,
      items: [],
      headerActions,
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns:
          SceneByVariableRepeaterGrid.DEFAULT_LAYOUT === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
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
    this.renderGridItems();

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

  subscribeToRefreshClick() {
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable & { update: () => void };
    const originalRefresh = variable.state.refresh;

    variable.setState({ refresh: VariableRefresh.never });

    const onClickRefresh = () => {
      variable.update();
    };

    // start of hack, for a better UX: once we've received the variable options, we disable its "refresh" option and we
    // allow the user to reload the list only by clicking on the "Refresh" button
    // if we don't do this, every time the time range changes (even with auto-refresh on), all the timeseries present on the screen are re-created,
    // resulting in blinking and a poor UX
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
          templateColumns: newState.layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
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

    return noDataSwitcherScene.subscribeToState(onChangeState);
  }

  getCurrentOptions(variable: QueryVariable): VariableValueOption[] {
    const { options, value: variableValue } = variable.state;

    if (this.state.variableName !== 'groupBy') {
      return options;
    }

    const groupByOptions = options.filter(({ value }) => value !== 'all');

    if (variableValue === 'all') {
      return groupByOptions;
    }

    const currentOption = groupByOptions.find((o) => variableValue === JSON.parse(o.value as string).value);

    if (!currentOption) {
      return [];
    }

    return JSON.parse(currentOption.value as string).groupBy.allValues.map((labelValue: string) => {
      const valueObject = {
        value: labelValue,
        // we need this for the "Flame graph" & "Add to filters" actions to work
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
    const serviceName = getSceneVariableValue(this, ServiceNameVariable);
    const profileMetricId = getSceneVariableValue(this, ProfileMetricVariable);

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

    return this.filterItems(items);
  }

  // TODO: prevent too many re-renders
  // eslint-disable-next-line sonarjs/cognitive-complexity
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

    const { headerActions, hideNoData, variableName } = this.state;

    const gridItems = this.state.items.map((item) => {
      const gridItemKey = SceneByVariableRepeaterGrid.buildGridItemKey(item);

      let data: SceneQueryRunner;

      const shouldRefreshFavoriteData = variableName === 'favorite' && item.queryRunnerParams.groupBy?.label;

      if (shouldRefreshFavoriteData) {
        // in case of the favorites grid with a groupBy param, we always refetch the label values so that the timeseries are up-to-date
        // see buildTimeSeriesGroupByQueryRunner()
        data = new SceneQueryRunner({
          queries: [],
        });
      } else {
        data = buildTimeSeriesQueryRunner(item.queryRunnerParams);

        if (hideNoData) {
          this.setupHideNoData(data, gridItemKey);
        }
      }

      const timeSeriesPanel = PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(data)
        .setMin(0)
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
          const $data = await buildTimeSeriesGroupByQueryRunner({
            queryRunnerParams: item.queryRunnerParams,
            timeRange: sceneGraph.getTimeRange(this).state.value,
          });

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

    const body = this.state.body as SceneCSSGridLayout;

    (body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS, // required to have the correct grid items height
      children: gridItems,
    });
  }

  filterItems(items: SceneByVariableRepeaterGridState['items']) {
    const quickFilterScene = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    const { searchText } = quickFilterScene.state;

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

    return items.filter(({ label }) => searchRegex.test(label));
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
