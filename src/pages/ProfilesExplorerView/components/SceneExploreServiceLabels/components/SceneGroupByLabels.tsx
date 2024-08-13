import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { CompareAction } from '../../../domain/actions/CompareAction';
import { FavAction } from '../../../domain/actions/FavAction';
import { SelectAction } from '../../../domain/actions/SelectAction';
import { EventAddLabelToFilters } from '../../../domain/events/EventAddLabelToFilters';
import { EventExpandPanel } from '../../../domain/events/EventExpandPanel';
import { EventSelectLabel } from '../../../domain/events/EventSelectLabel';
import { EventViewServiceFlameGraph } from '../../../domain/events/EventViewServiceFlameGraph';
import { addFilter } from '../../../domain/variables/FiltersVariable/filters-ops';
import { FiltersVariable } from '../../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../../domain/variables/GroupByVariable/GroupByVariable';
import { getSceneVariableValue } from '../../../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../../../infrastructure/series/helpers/getProfileMetricLabel';
import { SceneNoDataSwitcher } from '../../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { PanelType, ScenePanelTypeSwitcher } from '../../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { SceneByVariableRepeaterGrid } from '../../SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { GridItemData } from '../../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../../SceneDrawer';
import { SceneLabelValuesBarGauge } from '../../SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../../SceneLabelValuesTimeseries';
import { SceneProfilesExplorer } from '../../SceneProfilesExplorer/SceneProfilesExplorer';
import { SceneLabelValuesGrid } from './SceneLabelValuesGrid';

interface SceneGroupByLabelsState extends SceneObjectState {
  body?: SceneObject;
  drawer: SceneDrawer;
}

export class SceneGroupByLabels extends SceneObjectBase<SceneGroupByLabelsState> {
  constructor() {
    super({
      key: 'group-by-labels',
      body: undefined,
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const groupBySub = this.subscribeToGroupByChange();
    const panelTypeChangeSub = this.subscribeToPanelTypeChange();
    const filtersSub = this.subscribeToFiltersChange();
    const panelEventsSub = this.subscribeToPanelEvents();

    return () => {
      panelTypeChangeSub.unsubscribe();
      filtersSub.unsubscribe();
      panelEventsSub.unsubscribe();
      groupBySub.unsubscribe();
    };
  }

  subscribeToGroupByChange() {
    const groupByVariable = sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable);

    const onChangeState = (newState: typeof groupByVariable.state, prevState?: typeof groupByVariable.state) => {
      if (newState.value !== prevState?.value) {
        const quickFilter = sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter);
        quickFilter.clear();

        if (newState.value === 'all') {
          quickFilter.setPlaceholder('Search labels (comma-separated regexes are supported)');

          this.setState({
            body: this.buildSceneByVariableRepeaterGrid(),
          });
        } else {
          quickFilter.setPlaceholder('Search label values (comma-separated regexes are supported)');

          this.setState({
            body: this.buildSceneLabelValuesGrid(),
          });
        }
      }
    };

    onChangeState(groupByVariable.state);

    return groupByVariable.subscribeToState(onChangeState);
  }

  buildSceneByVariableRepeaterGrid() {
    return new SceneByVariableRepeaterGrid({
      key: 'service-labels-grid',
      variableName: 'groupBy',
      mapOptionToItem: (option, index, { serviceName, profileMetricId, panelType }) => {
        if (option.value === 'all') {
          return null;
        }

        // see LabelsDataSource.ts
        const { value, groupBy } = JSON.parse(option.value as string);

        return {
          index,
          value,
          // remove the count in parenthesis that exists in option.label
          // it'll be set by SceneLabelValuesTimeseries or SceneLabelValuesBarGauge
          label: value,
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            groupBy,
            filters: [],
          },
          panelType: panelType as PanelType,
        };
      },
      headerActions: (item, items) => {
        const { queryRunnerParams } = item;

        if (!queryRunnerParams.groupBy) {
          if (items.length > 1) {
            return [
              new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new CompareAction({ item }),
              new FavAction({ item }),
            ];
          }

          return [
            new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
            new SelectAction({ EventClass: EventAddLabelToFilters, item }),
            new FavAction({ item }),
          ];
        }

        // FIXME: should be based on how many series are displayed -> re-render header actions after each data load
        if (queryRunnerParams.groupBy.values.length > 1) {
          return [
            new SelectAction({ EventClass: EventSelectLabel, item }),
            new SelectAction({ EventClass: EventExpandPanel, item }),
            new FavAction({ item }),
          ];
        }

        return [new FavAction({ item })];
      },
    });
  }

  buildSceneLabelValuesGrid() {
    return new SceneLabelValuesGrid({
      key: 'service-label-values-grid',
      headerActions: (item, items) => {
        const { queryRunnerParams } = item;

        if (!queryRunnerParams.groupBy) {
          if (items.length > 1) {
            return [
              new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              new SelectAction({ EventClass: EventAddLabelToFilters, item }),
              new CompareAction({ item }),
              new FavAction({ item }),
            ];
          }

          return [
            new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
            new SelectAction({ EventClass: EventAddLabelToFilters, item }),
            new FavAction({ item }),
          ];
        }

        if (queryRunnerParams.groupBy.values.length > 1) {
          return [
            new SelectAction({ EventClass: EventSelectLabel, item }),
            new SelectAction({ EventClass: EventExpandPanel, item }),
            new FavAction({ item }),
          ];
        }

        return [new FavAction({ item })];
      },
    });
  }

  subscribeToPanelTypeChange() {
    const panelTypeSwitcher = sceneGraph.findByKeyAndType(this, 'panel-type-switcher', ScenePanelTypeSwitcher);

    return panelTypeSwitcher.subscribeToState(
      (newState: typeof panelTypeSwitcher.state, prevState?: typeof panelTypeSwitcher.state) => {
        if (newState.panelType !== prevState?.panelType) {
          (this.state.body as SceneByVariableRepeaterGrid | SceneLabelValuesGrid)?.renderGridItems();
        }
      }
    );
  }

  subscribeToFiltersChange() {
    const filtersVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);
    const noDataSwitcher = sceneGraph.findByKeyAndType(this, 'no-data-switcher', SceneNoDataSwitcher);

    // the handler will be called each time a filter is added/removed/modified
    return filtersVariable.subscribeToState(() => {
      if (noDataSwitcher.state.hideNoData === 'on') {
        // we force render because the filters only influence the query made in each panel, not the list of items to render (which come from the groupBy options)
        (this.state.body as SceneByVariableRepeaterGrid | SceneLabelValuesGrid)?.renderGridItems(true);
      }
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
    const groupByVariable = sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable);

    groupByVariable.changeValueTo(labelValue);

    // the event may be published from an expanded panel in the drawer
    this.state.drawer.close();
  }

  addLabelValueToFilters(item: GridItemData) {
    const filterByVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);

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

    const goupByVariable = sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable);
    goupByVariable.changeValueTo(GroupByVariable.DEFAULT_VALUE);
  }

  openExpandedPanelDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: this.buildtimeSeriesPanelTitle(item),
      body:
        item.panelType === PanelType.BARGAUGE
          ? new SceneLabelValuesBarGauge({
              item,
              headerActions: () => [new SelectAction({ EventClass: EventSelectLabel, item }), new FavAction({ item })],
            })
          : new SceneLabelValuesTimeseries({
              displayAllValues: true,
              item,
              headerActions: () => [new SelectAction({ EventClass: EventSelectLabel, item }), new FavAction({ item })],
            }),
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

    const groupByVariable = sceneGraph.findByKeyAndType(model, 'groupBy', GroupByVariable);
    const { gridControls } = sceneGraph.findByKeyAndType(model, 'profiles-explorer', SceneProfilesExplorer).state;

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
