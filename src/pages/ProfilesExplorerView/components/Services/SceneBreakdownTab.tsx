import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import React from 'react';

import { fetchLabelsData } from '../fetchLabelsData';
import { getColorByIndex } from '../getColorByIndex';
import { PinServiceAction } from '../PinServiceAction';
import { ViewFlameGraphAction } from '../ViewFlameGraphAction';
import { CompareAction } from './actions/CompareAction';
import { SelectLabelAction } from './actions/SelectLabelAction';
import { ViewDrawerFlameGraphAction } from './actions/ViewDrawerFlameGraphAction';
import { getServiceLabelsQueryRunner } from './data/getServiceLabelsQueryRunner';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { SceneBreakdownLabelSelector } from './SceneBreakdownLabelSelector';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '260px';

export interface SceneBreakdownTabState extends SceneObjectState {
  serviceName: string;
  labelsData: Array<{ id: string; values: string[] }>;
  labelsForDiff: Array<{ id: string; value: string; index: number }>;
  body: SceneFlexLayout;
  isFlameGraphOpen: boolean;
}

export class SceneBreakdownTab extends SceneObjectBase<SceneBreakdownTabState> {
  constructor(state: Partial<SceneBreakdownTabState>) {
    super({
      serviceName: state.serviceName as string,
      labelsData: [],
      labelsForDiff: [],
      isFlameGraphOpen: false,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            body: new SceneBreakdownLabelSelector({
              key: 'labelSelector',
              isLoading: true,
              activeLabelId: '',
            }),
          }),
          new SceneFlexItem({
            body: new SceneCSSGridLayout({
              key: 'labelsGrid',
              templateColumns: GRID_TEMPLATE_COLUMNS,
              autoRows: GRID_AUTO_ROWS,
              isLazy: true,
              children: [],
              $behaviors: [
                new behaviors.CursorSync({
                  key: 'metricCrosshairSync',
                  sync: DashboardCursorSync.Crosshair,
                }),
              ],
            }),
          }),
        ],
      }),
    });

    this.onActivate = this.onActivate.bind(this);
    this.addActivationHandler(() => {
      this.onActivate();
    });
  }

  findObjects() {
    const labelSelector = sceneGraph.findObject(
      this,
      (o) => o.state.key === 'labelSelector'
    ) as SceneBreakdownLabelSelector;

    const labelsGrid = sceneGraph.findObject(this, (o) => o.state.key === 'labelsGrid') as SceneCSSGridLayout;

    return {
      labelSelector,
      labelsGrid,
    };
  }

  async onActivate() {
    const { serviceName } = this.state;

    const profileMetric = sceneGraph.lookupVariable('profileMetric', this)!.getValue() as string;
    const query = `${profileMetric}{service_name="${serviceName}"}`;

    const timeRange = sceneGraph.getTimeRange(this).state.value;

    this.setState({
      labelsData: await fetchLabelsData(query, timeRange),
    });

    const { labelSelector, labelsGrid } = this.findObjects();

    labelSelector.setState({
      isLoading: false,
      activeLabelId: 'all',
    });

    labelsGrid.setState({
      children: this.buildLabelGridItems(),
    });
  }

  selectLabel(labelId: string) {
    const { labelSelector, labelsGrid } = this.findObjects();

    labelSelector.setState({
      activeLabelId: labelId,
    });

    labelsGrid.setState({
      children: labelId === 'all' ? this.buildLabelGridItems() : this.buildLabelValueGridItems(labelId),
    });

    this.setState({ labelsForDiff: [] });
  }

  selectForComparison(labelId: string, labelValue: string, isChecked: boolean, index: number) {
    let { labelsForDiff } = this.state;

    if (isChecked) {
      const method = labelsForDiff[0] && labelsForDiff[0].index > index ? 'unshift' : 'push';

      labelsForDiff[method]({
        id: labelId,
        value: labelValue,
        index,
      });
    } else {
      labelsForDiff = labelsForDiff.filter(({ id, value }) => id !== labelId || value !== labelValue);
    }

    this.toggleCompareCheckboxes(labelsForDiff.length === 2, labelsForDiff);

    this.setState({ labelsForDiff });
  }

  toggleCompareCheckboxes(disableAll: boolean, labelsForDiff: SceneBreakdownTabState['labelsForDiff']) {
    const labelsGrid = sceneGraph.findObject(this, (o) => o.state.key === 'labelsGrid') as SceneCSSGridLayout;

    (labelsGrid.state.children as SceneCSSGridItem[]).forEach((c) => {
      const compareAction = sceneGraph.findObject(c, (o) => o.state.key === 'compareAction') as CompareAction;

      compareAction.setState({
        isDisabled: disableAll && !compareAction.state.isChecked,
      });

      const viewAction = sceneGraph.findObject(
        c,
        (o) => o.state.key === 'viewFlameGraphAction'
      ) as ViewFlameGraphAction;

      viewAction.setState({
        labelsForDiff: disableAll && compareAction.state.isChecked ? labelsForDiff : [],
      });
    });
  }

  buildLabelGridItems() {
    const { serviceName, labelsData } = this.state;
    const profileMetricId = sceneGraph.lookupVariable('profileMetric', this)!.getValue() as string;
    const timeRange = sceneGraph.getTimeRange(this).state.value;

    return labelsData.map(({ id, values }, i) => {
      const gotoSingleViewAction =
        values.length === 1
          ? new ViewFlameGraphAction({ serviceName, profileMetricId, labelId: id, labelValue: values[0], timeRange })
          : null;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(id)
          .setOption('legend', { showLegend: true })
          .setData(getServiceLabelsQueryRunner(serviceName, id, values))
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
          .setOverrides((overrides) => {
            values.forEach((value, j) => {
              overrides
                .matchFieldsByQuery(value)
                .overrideColor({
                  mode: 'fixed',
                  fixedColor: getColorByIndex(i + j),
                })
                .overrideDisplayName(value);
            });
          })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            gotoSingleViewAction || new SelectLabelAction({ labelId: id }),
            new PinServiceAction({ key: 'pinnedLabels', value: id }),
          ])
          .build(),
      });
    });
  }

  buildLabelValueGridItems(labelId: string) {
    const { serviceName, labelsData } = this.state;
    const profileMetricId = sceneGraph.lookupVariable('profileMetric', this)!.getValue() as string;
    const timeRange = sceneGraph.getTimeRange(this).state.value;

    const labelValues = labelsData.find(({ id }) => id === labelId)?.values || [];

    return labelValues.map((labelValue, i) => {
      const labelSelector = `${labelId}="${labelValue}"`;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(labelValue)
          .setOption('legend', { showLegend: true })
          .setData(getServiceQueryRunner(serviceName, labelSelector))
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
          .setOverrides((overrides) => {
            overrides
              .matchFieldsByQuery(`${serviceName}-${labelSelector}`)
              .overrideColor({
                mode: 'fixed',
                fixedColor: getColorByIndex(i),
              })
              .overrideDisplayName(labelValue);
          })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            new CompareAction({ key: 'compareAction', index: i, labelId, labelValue }),
            new ViewFlameGraphAction({
              key: 'viewFlameGraphAction',
              profileMetricId,
              serviceName,
              labelId,
              labelValue,
              timeRange,
            }),
            new ViewDrawerFlameGraphAction({
              labelId,
              labelValue,
            }),
          ])
          .build(),
      });
    });
  }

  openFlameGraph(labelId: string, labelValue: string) {
    console.log('*** openFlameGraph', labelId, labelValue);

    this.setState({
      isFlameGraphOpen: true,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneBreakdownTab>) => {
    const { body, serviceName, isFlameGraphOpen } = model.useState();

    return (
      <>
        <body.Component model={body} />
        {isFlameGraphOpen && (
          <Drawer size="lg" onClose={() => model.setState({ isFlameGraphOpen: false })}>
            <h3>🔥 Flame graph for {serviceName}</h3>
            <div>
              <em>Work-in-progress...</em>
            </div>
          </Drawer>
        )}
      </>
    );
  };
}
