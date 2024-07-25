import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2 } from '@grafana/data';
import {
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import {
  PanelType,
  ScenePanelTypeSwitcher,
} from '../../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../../components/SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../../components/SceneDrawer';
import { SceneLabelValuesBarGauge } from '../../components/SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../../components/SceneLabelValuesTimeseries';
import { SceneProfilesExplorer } from '../../components/SceneProfilesExplorer/SceneProfilesExplorer';
import { CompareAction } from '../../domain/actions/CompareAction';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventAddLabelToFilters } from '../../domain/events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../domain/events/EventExpandPanel';
import { EventSelectLabel } from '../../domain/events/EventSelectLabel';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { addFilter } from '../../domain/variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../../infrastructure/series/helpers/getProfileMetricLabel';
import { LayoutType, SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';

interface SceneGroupByLabelsState extends SceneObjectState {
  body?: SceneObject;
  drawer: SceneDrawer;
}

const MIN_HEIGHT_SINGLE_PANEL = '240px';

export class SceneGroupByLabels extends SceneObjectBase<SceneGroupByLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['groupBy'],
    onReferencedVariableValueChanged: this.onGroupByValueChanged.bind(this),
  });

  constructor() {
    super({
      key: 'group-by-labels',
      body: undefined,
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).setPlaceholder(
      'Search labels (comma-separated regexes are supported)'
    );

    this.toggleLayoutSwitcherOptions(getSceneVariableValue(this, 'groupBy'));

    const panelTypeChangeSub = this.subscribeToPanelTypeChange();
    const layoutChangeSub = this.subscribeToLayoutChange();
    const filtersSub = this.subscribeToFiltersChange();
    const panelEventsSub = this.subscribeToPanelEvents();

    this.buildBody();

    return () => {
      panelEventsSub.unsubscribe();
      filtersSub.unsubscribe();
      layoutChangeSub.unsubscribe();
      panelTypeChangeSub.unsubscribe();
    };
  }

  onGroupByValueChanged(variable: any) {
    const { value } = variable.state;

    this.toggleLayoutSwitcherOptions(value);

    if (value !== 'all') {
      const { layout } = (findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher).state;

      if (layout === LayoutType.SINGLE) {
        this.buildSinglePanel(); // TODO: only update item, not the whole build -> subscribeToState in SceneLabelValuesBarGauge and SceneLabelValuesTimeseries
      }
    }
  }

  toggleLayoutSwitcherOptions(groupByValue: string) {
    (findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher).toggleOptions(
      groupByValue === 'all' ? 'default' : 'groupBy'
    );
  }

  buildBody() {
    (findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher).state.layout === LayoutType.SINGLE
      ? this.buildSinglePanel()
      : this.buildGrid();
  }

  subscribeToPanelTypeChange() {
    return (findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher).subscribeToState(
      (newState, prevState) => {
        if (newState.panelType === prevState.panelType) {
          return;
        }

        if (this.state.body instanceof SceneByVariableRepeaterGrid) {
          this.state.body.renderGridItems();
        } else {
          this.buildBody();
        }
      }
    );
  }

  subscribeToLayoutChange() {
    return (findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher).subscribeToState(
      (newState, prevState) => {
        if (newState.layout === prevState.layout) {
          return;
        }

        return newState.layout === LayoutType.SINGLE ? this.buildSinglePanel() : this.buildGrid();
      }
    );
  }

  subscribeToFiltersChange() {
    const noDataSwitcher = findSceneObjectByClass(this, SceneNoDataSwitcher) as SceneNoDataSwitcher;

    return (findSceneObjectByClass(this, FiltersVariable) as FiltersVariable).subscribeToState(() => {
      // the handler will be called each time a filter is added/removed/modified
      if (noDataSwitcher.state.hideNoData === 'on' && this.state.body instanceof SceneByVariableRepeaterGrid) {
        // we force render because the filters only influence the query made in each panel, not the list of items to render (which come from the groupBy options)
        this.state.body.renderGridItems(true);
      }
    });
  }

  buildGrid() {
    this.setState({
      body: new SceneByVariableRepeaterGrid({
        key: 'service-labels-grid',
        variableName: 'groupBy',
        headerActions: (item) => {
          const { queryRunnerParams } = item;

          if (!queryRunnerParams.groupBy) {
            return [
              new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new CompareAction({ item }),
              new FavAction({ item }),
            ];
          }

          return [
            new SelectAction({ EventClass: EventSelectLabel, item }),
            new SelectAction({ EventClass: EventExpandPanel, item }),
            new FavAction({ item }),
          ];
        },
      }),
    });
  }

  buildSinglePanel() {
    const { panelType } = (findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher).state;
    const label = getSceneVariableValue(this, 'groupBy');

    const item = {
      index: 0,
      value: '',
      label,
      panelType,
      // let actions interpolate the missing values
      queryRunnerParams: {
        groupBy: {
          label,
          values: [],
        },
      },
    };

    const headerActions = (item: GridItemData) => [
      new SelectAction({ EventClass: EventExpandPanel, item }),
      new FavAction({ item }),
    ];

    this.setState({
      body: new SceneFlexLayout({
        direction: 'row',
        children: [
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_SINGLE_PANEL,
            body:
              panelType === PanelType.BARGAUGE
                ? new SceneLabelValuesBarGauge({ item, headerActions })
                : new SceneLabelValuesTimeseries({ item, headerActions }),
          }),
        ],
      }),
    });
  }

  subscribeToPanelEvents() {
    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
      this.selectLabel(event.payload.item);
    });

    const addToFiltersSub = this.subscribeToEvent(EventAddLabelToFilters, (event) => {
      this.addLabelValueToFilters(event.payload.item);
    });

    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return {
      unsubscribe() {
        expandPanelSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  selectLabel({ queryRunnerParams }: GridItemData) {
    const labelValue = queryRunnerParams!.groupBy!.label;
    const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;

    // we clear the filter before changing the groupBy value because changing it will _directly_ cause the grid items to be updated
    // by doing so, we prevent a flash of "No results"
    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).clear();

    groupByVariable.changeValueTo(labelValue);

    // the event may be published from an expanded panel in the drawer
    this.state.drawer.close();
  }

  addLabelValueToFilters(item: GridItemData) {
    const filterByVariable = findSceneObjectByClass(this, FiltersVariable) as FiltersVariable;

    let filterToAdd: AdHocVariableFilter;
    const { filters, groupBy } = item.queryRunnerParams;

    if (filters?.[0]) {
      filterToAdd = filters?.[0];
    } else if (groupBy?.values.length === 1) {
      filterToAdd = { key: groupBy.label, operator: '=', value: groupBy.values[0] };
    } else {
      const error = new Error('Cannot build filter! Missing "filters" and "groupBy" value.');
      console.error(error);
      console.info(item);
      throw error;
    }

    addFilter(filterByVariable, filterToAdd);

    const goupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;
    goupByVariable.changeValueTo(GroupByVariable.DEFAULT_VALUE);

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).clear();
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const { layout } = (findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher).state;

    const headerActions =
      layout === LayoutType.SINGLE
        ? () => [new FavAction({ item })]
        : () => [new SelectAction({ EventClass: EventSelectLabel, item }), new FavAction({ item })];

    this.state.drawer.open({
      title: this.buildtimeSeriesPanelTitle(item),
      body:
        item.panelType === PanelType.BARGAUGE
          ? new SceneLabelValuesBarGauge({ item, headerActions })
          : new SceneLabelValuesTimeseries({ displayAllValues: true, item, headerActions }),
    });
  }

  buildtimeSeriesPanelTitle(item: GridItemData) {
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    return `${serviceName} · ${getProfileMetricLabel(profileMetricId)} · ${item.label}`;
  }

  static Component = ({ model }: SceneComponentProps<SceneGroupByLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, drawer } = model.useState();

    const groupByVariable = findSceneObjectByClass(model, GroupByVariable);
    const { gridControls } = (findSceneObjectByClass(model, SceneProfilesExplorer) as SceneProfilesExplorer).state;

    return (
      <div className={styles.container}>
        <groupByVariable.Component model={groupByVariable} />

        <div className={styles.sceneControls}>
          {gridControls.length ? (
            <Stack wrap="wrap">
              {gridControls.map((control) => (
                <control.Component key={control.key} model={control} />
              ))}
            </Stack>
          ) : null}
        </div>

        {body && <body.Component model={body} />}
        {<drawer.Component model={drawer} />}
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-top: ${theme.spacing(1)};
  `,
  sceneControls: css`
    margin-bottom: ${theme.spacing(1)};
  `,
});
