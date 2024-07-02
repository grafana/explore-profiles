import { FieldMatcherID, LoadingState, MappingType } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { TableCellDisplayMode } from '@grafana/ui';
import React from 'react';

import { getProfileMetricUnit } from '../data/series/helpers/getProfileMetricUnit';
import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';

interface SceneAllLabelValuesTableState extends SceneObjectState {
  item: GridItemData;
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  body?: VizPanel;
}

export class SceneAllLabelValuesTable extends SceneObjectBase<SceneAllLabelValuesTableState> {
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

  constructor({
    item,
    headerActions,
  }: {
    item: SceneAllLabelValuesTableState['item'];
    headerActions: SceneAllLabelValuesTableState['headerActions'];
  }) {
    super({
      key: 'table-label-values-distribution',
      item,
      headerActions,
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const dataSub = this.buildTable();

    return () => {
      dataSub.unsubscribe();
    };
  }

  buildTable() {
    const { item, headerActions } = this.state;
    const { queryRunnerParams } = item;

    const data = new SceneDataTransformer({
      $data: buildTimeSeriesQueryRunner(queryRunnerParams),
      transformations: SceneAllLabelValuesTable.DATA_TRANSFORMATIONS,
    });

    this.setState({
      body: PanelBuilders.table()
        .setData(data)
        .setDisplayMode('transparent')
        .setHeaderActions(headerActions(item))
        .setOption('sortBy', [{ displayName: 'Total', desc: true }])
        .build(),
    });

    return data.subscribeToState((newState) => {
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
            unit: getProfileMetricUnit(queryRunnerParams.profileMetricId!),
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
              properties: [{ id: 'unit', value: 'string' }],
            },
          ],
        },
      });
    });
  }

  static Component({ model }: SceneComponentProps<SceneAllLabelValuesTable>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
