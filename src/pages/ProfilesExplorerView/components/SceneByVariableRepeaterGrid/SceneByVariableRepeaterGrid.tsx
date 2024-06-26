import { DashboardCursorSync, LoadingState, VariableRefresh } from '@grafana/data';
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
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';

import { LabelsDataSource } from '../../data/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { ProfileMetricVariable } from '../../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../variables/ServiceNameVariable';
import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
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
    return `grid-item-${item.value}`;
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
    // here we try to emulate VariableDependencyConfig.onVariableUpdateCompleted
    const variable = sceneGraph.lookupVariable(this.state.variableName, this) as QueryVariable;

    this.renderGridItems();

    const variableSub = variable.subscribeToState((newState, prevState) => {
      if (!newState.loading && prevState.loading) {
        this.renderGridItems();
        return;
      }

      // TODO: create a dedicated variable?
      if (variable.state.name === 'groupBy' && !newState.loading && newState.value !== prevState.value) {
        this.renderGridItems();
      }
    });

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
    // end of hack

    return {
      unsubscribe() {
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

  // TODO: refactor - split/extract method
  buildItemsData() {
    const { variableName } = this.state;
    const variable = sceneGraph.lookupVariable(variableName, this) as QueryVariable;
    const serviceName = getSceneVariableValue(this, ServiceNameVariable);
    const profileMetricId = getSceneVariableValue(this, ProfileMetricVariable);

    // TODO: find a better way
    if (variableName !== 'groupBy') {
      const items = variable.state.options.map(({ value, label }, index) => ({
        index: Number(index),
        value: String(value),
        label: String(label),
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          [variableName as keyof GridItemData['queryRunnerParams']]: String(value),
          filters: [],
        },
      }));

      return this.filterItems(items);
    }

    let options = variable.state.options.filter(({ value }) => value !== 'all');

    if (variable.state.value !== 'all') {
      const currentOption = options.find(({ value }) => {
        // see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts
        const { labelName } = JSON.parse(String(value)) as unknown as {
          labelName: string;
          labelValues: string[];
        };

        return labelName === variable.state.value;
      });

      if (!currentOption) {
        return [];
      }

      const { labelName, labelValues } = JSON.parse(String(currentOption?.value)) as unknown as {
        labelName: string;
        labelValues: string[];
      };

      const items = labelValues.map((value, index) => ({
        index,
        label: value,
        value,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          filters: [{ key: labelName, operator: '=', value }],
        },
      }));

      return this.filterItems(items);
    }

    const items = options.map(({ value }, index) => {
      // see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts
      const { labelName, labelValues } = JSON.parse(String(value)) as unknown as {
        labelName: string;
        labelValues: string[];
      };

      return {
        index: Number(index),
        value: labelName,
        label: labelName,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          filters: [],
          groupBy: {
            label: labelName,
            values: labelValues.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES),
            allValues: labelValues,
          },
        },
      };
    });

    return this.filterItems(items);
  }

  // TODO: prevent too many re-renders
  renderGridItems() {
    this.setState({ items: this.buildItemsData() });

    if (!this.state.items.length) {
      this.renderEmptyState();
      return;
    }

    const { headerActions, hideNoData } = this.state;

    const gridItems = this.state.items.map((item) => {
      const gridItemKey = SceneByVariableRepeaterGrid.buildGridItemKey(item);

      const data = buildTimeSeriesQueryRunner(item.queryRunnerParams);

      if (hideNoData) {
        this.setupHideNoData(data, gridItemKey);
      }

      const timeSeriesPanel = PanelBuilders.timeseries()
        .setTitle(item.label)
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

  static Component({ model }: SceneComponentProps<SceneByVariableRepeaterGrid>) {
    const { body, variableName } = model.useState();
    const { loading } = (sceneGraph.lookupVariable(variableName, model) as QueryVariable)?.useState();

    return loading ? <Spinner /> : <body.Component model={body} />;
  }
}
