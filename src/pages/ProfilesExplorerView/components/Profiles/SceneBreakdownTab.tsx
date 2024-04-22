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
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../FavAction';
import { fetchLabelsData } from '../fetchLabelsData';
import { getColorByIndex } from '../getColorByIndex';
import { ViewFlameGraphAction } from '../ViewFlameGraphAction';
import { CompareAction } from './actions/CompareAction';
import { ExpandAction, ExpandActionState } from './actions/ExpandAction';
import { SelectLabelAction } from './actions/SelectLabelAction';
import { getProfileMetricLabelsQueryRunner } from './data/getProfileMetricLabelsQueryRunner';
import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';
import { SceneBreakdownLabelSelector } from './SceneBreakdownLabelSelector';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

export interface SceneBreakdownTabState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  labelsData: Array<{ id: string; values: string[] }>;
  labelsForDiff: Array<{ id: string; value: string; index: number }>;
  body: SceneFlexLayout;
  drawerBody?: VizPanel;
}

export class SceneBreakdownTab extends SceneObjectBase<SceneBreakdownTabState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName'],
    onReferencedVariableValueChanged: this.onActivate.bind(this),
  });

  constructor(state: Partial<SceneBreakdownTabState>) {
    super({
      key: 'breakdown-tab',
      profileMetric: state.profileMetric as SceneBreakdownTabState['profileMetric'],
      labelsData: [],
      labelsForDiff: [],
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
    const { profileMetric } = this.state;
    const { labelSelector, labelsGrid } = this.findObjects();

    const serviceName = sceneGraph.lookupVariable('serviceName', this)!.getValue() as string;
    const query = `${profileMetric.value}{service_name="${serviceName}"}`;

    const timeRange = sceneGraph.getTimeRange(this).state.value;

    labelsGrid.setState({
      children: [],
    });

    labelSelector.setState({
      isLoading: true,
    });

    this.setState({
      labelsData: await fetchLabelsData(query, timeRange),
    });

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
    const { profileMetric, labelsData } = this.state;
    const serviceName = sceneGraph.lookupVariable('serviceName', this)!.getValue() as string;
    const timeRange = sceneGraph.getTimeRange(this).state.value;

    return labelsData.map(({ id, values }, i) => {
      const viewFlameGraphAction =
        values.length === 1
          ? new ViewFlameGraphAction({
              serviceName,
              profileMetricId: profileMetric.value,
              labelId: id,
              labelValue: values[0],
              timeRange,
            })
          : null;

      const panelKey = `panel-${profileMetric.value}-${id}`;

      const vizPanel: VizPanel = PanelBuilders.timeseries()
        .setTitle(id)
        .setOption('legend', { showLegend: true })
        .setData(
          getProfileMetricLabelsQueryRunner({
            profileMetricId: profileMetric.value,
            labelId: id,
            labelValues: values,
          })
        )
        .setOverrides((overrides) => {
          values.forEach((value, j) => {
            overrides
              .matchFieldsByQuery(`${profileMetric.value}-${id}-${value}`)
              .overrideColor({
                mode: 'fixed',
                fixedColor: getColorByIndex(i + j),
              })
              .overrideDisplayName(value);
          });
        })
        .setCustomFieldConfig('fillOpacity', 9)
        .setHeaderActions([
          viewFlameGraphAction || new SelectLabelAction({ labelId: id }),
          new FavAction({ key: 'pinnedLabels', value: id }),
          new ExpandAction({ panelKey }),
        ])
        .build();

      vizPanel.setState({ key: panelKey });

      return new SceneCSSGridItem({
        body: vizPanel,
      });
    });
  }

  buildLabelValueGridItems(labelId: string) {
    const { profileMetric, labelsData } = this.state;
    const serviceName = sceneGraph.lookupVariable('serviceName', this)!.getValue() as string;
    const timeRange = sceneGraph.getTimeRange(this).state.value;

    const labelValues = labelsData.find(({ id }) => id === labelId)?.values || [];

    return labelValues.map((labelValue, i) => {
      const labelSelector = `${labelId}="${labelValue}"`;
      const panelKey = `panel-${profileMetric.value}-${labelId}-${labelValue}`;

      const vizPanel: VizPanel = PanelBuilders.timeseries()
        .setTitle(labelValue)
        .setOption('legend', { showLegend: false }) // hide profile metric
        .setData(
          getProfileMetricQueryRunner({
            profileMetricId: profileMetric.value,
            labelSelector,
          })
        )
        .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
        .setCustomFieldConfig('fillOpacity', 9)
        .setHeaderActions([
          new CompareAction({ key: 'compareAction', index: i, labelId, labelValue }),
          new ViewFlameGraphAction({
            key: 'viewFlameGraphAction',
            profileMetricId: profileMetric.value,
            serviceName,
            labelId,
            labelValue,
            timeRange,
          }),
          new ExpandAction({ panelKey }),
        ])
        .build();

      vizPanel.setState({ key: panelKey });

      return new SceneCSSGridItem({
        body: vizPanel,
      });
    });
  }

  viewExpandedPanel({ panelKey }: ExpandActionState) {
    const vizPanel = sceneGraph.findObject(this, (o) => o.state.key === panelKey) as VizPanel;
    const drawerBody = vizPanel.clone();

    drawerBody.setState({
      headerActions: (drawerBody.state.headerActions as SceneObject[]).filter((action) => action instanceof FavAction),
    });

    this.setState({ drawerBody });
  }

  public static Component = ({ model }: SceneComponentProps<SceneBreakdownTab>) => {
    const { body, drawerBody } = model.useState();

    return (
      <>
        <body.Component model={body} />
        {drawerBody && (
          <Drawer size="lg" onClose={() => model.setState({ drawerBody: undefined })}>
            <drawerBody.Component model={drawerBody} />
          </Drawer>
        )}
      </>
    );
  };
}
