import { FieldMatcherID, LoadingState, MappingType } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { TableCellDisplayMode } from '@grafana/ui';
import React from 'react';

import { SelectAction } from '../actions/SelectAction';
import { getProfileMetricUnit } from '../data/series/helpers/getProfileMetricUnit';
import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { EventExpandPanel } from '../events/EventExpandPanel';
import { EventViewServiceFlameGraph } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';

interface SceneLabelValuesDistributionTableState extends SceneObjectState {
  item: GridItemData;
  body?: VizPanel;
}

export class SceneLabelValuesDistributionTable extends SceneObjectBase<SceneLabelValuesDistributionTableState> {
  static DATA_TRANSFORMATIONS = [
    {
      id: 'reduce',
      options: {
        labelsToFields: true,
        reducers: ['mean', 'stdDev', 'sum'],
      },
    },
    {
      id: 'organize',
      options: {
        excludeByName: {
          Field: true,
        },
      },
    },
  ];

  constructor({ item }: { item: SceneLabelValuesDistributionTableState['item'] }) {
    super({
      key: 'table-label-values-distribution',
      item,
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setState({
      body: this.buildTable(),
    });
  }

  buildTable() {
    const { item } = this.state;

    return PanelBuilders.table()
      .setData(this.buildData())
      .setDisplayMode('transparent')
      .setUnit(getProfileMetricUnit(item.queryRunnerParams.profileMetricId!))
      .setHeaderActions([
        new SelectAction({ EventClass: EventViewServiceLabels, item }),
        new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
        new SelectAction({ EventClass: EventExpandPanel, item }),
      ])
      .setOption('sortBy', [{ displayName: 'Total', desc: true }])
      .build();
  }

  buildData() {
    const { item } = this.state;
    const { queryRunnerParams } = item;

    const data = new SceneDataTransformer({
      $data: buildTimeSeriesQueryRunner(queryRunnerParams),
      transformations: SceneLabelValuesDistributionTable.DATA_TRANSFORMATIONS,
    });

    data.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Done) {
        return;
      }

      this.state.body!.setState({
        fieldConfig: {
          defaults: {
            color: { mode: 'fixed', fixedColor: '#CCCCDC' },
            custom: {
              filterable: true,
              cellOptions: {
                type: TableCellDisplayMode.ColorText,
              },
            },
            mappings: [
              {
                type: MappingType.ValueToText,
                options: newState.data.series[0].fields[0].values.reduce((acc, value, index) => {
                  acc[value] = {
                    text: value,
                    color: getColorByIndex(index),
                    index,
                  };
                  return acc;
                }, {}),
              },
            ],
          },
          overrides: [
            {
              matcher: { id: FieldMatcherID.byName, options: queryRunnerParams.groupBy!.label },
              properties: [
                {
                  id: 'unit',
                  value: 'string',
                },
              ],
            },
          ],
        },
      });
    });

    return data;
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesDistributionTable>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
