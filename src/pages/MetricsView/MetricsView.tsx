import { css } from '@emotion/css';
import { applyFieldOverrides, arrayToDataFrame, DataFrame, FieldType, GrafanaTheme2 } from '@grafana/data';
import { TableCellHeight } from '@grafana/schema';
import {
  Icon,
  IconButton,
  Stack,
  Table,
  TableCellDisplayMode,
  TableCustomCellOptions,
  TagList,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { Metric } from '@shared/infrastructure/metrics/Metric';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useCreatedMetricsView } from './domain/useCreatedMetricsView';

export function MetricsView() {
  const styles = useStyles2(getStyles);
  const { data } = useCreatedMetricsView();
  const { metrics } = data;

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving created metrics!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const theme = useTheme2();
  const dataFrame = metrics !== undefined ? buildDataFrame(metrics, theme, styles) : null;

  return (
    <>
      <PageTitle title="Created metrics" />
      {dataFrame && (
        <Table
          data={dataFrame}
          width={2000}
          height={500}
          columnMinWidth={130}
          cellHeight={TableCellHeight.Auto}
          resizable={false}
        />
      )}
    </>
  );
}

const getStyles = () => ({
  tagList: css`
    flex-direction: row;
    justify-content: start;
  `,
});

function buildDataFrame(metrics: Metric[], theme: GrafanaTheme2, styles: any): DataFrame {
  const df = arrayToDataFrame(
    metrics.map((m) => ({
      Name: m.name,
      'Profile Type': m.profileType,
    }))
  );

  const dataSourceOptions: TableCustomCellOptions = {
    type: TableCellDisplayMode.Custom,
    cellComponent: (props) => {
      const dataSource = metrics[props.rowIndex]?.prometheusDataSource ?? '';
      return (
        <Stack direction="row" alignItems="center">
          {/* note(bryanhuhta): This color is taken from the Prometheus svg from grafana.com */}
          <Icon name="gf-prometheus" color="#DA4E31" />
          <span>{dataSource}</span>
        </Stack>
      );
    },
  };

  const labelOptions: TableCustomCellOptions = {
    type: TableCellDisplayMode.Custom,
    cellComponent: (props) => {
      const labels = metrics[props.rowIndex]?.labels?.filter((label: string) => !label.match(/^__\S+__$/));

      if (!labels || labels.length === 0) {
        return <span>All</span>;
      }

      return <TagList className={styles.tagList} displayMax={3} tags={labels} />;
    },
  };

  const actionOptions: TableCustomCellOptions = {
    type: TableCellDisplayMode.Custom,
    cellComponent: (props) => {
      const name = props.frame.fields.find((f) => f.name === 'Name')?.values[props.rowIndex];
      const label = name ? `Delete ${name}` : 'Delete metric';

      return (
        <IconButton name="trash-alt" variant="destructive" aria-label={label} tooltip={label} onClick={() => {}} />
      );
    },
  };

  df.fields = [
    ...df.fields,
    {
      name: 'Data Source',
      type: FieldType.other,
      values: [],
      config: {
        custom: {
          cellOptions: dataSourceOptions,
        },
      },
    },
    {
      name: 'Labels',
      type: FieldType.other,
      values: [],
      config: {
        custom: {
          cellOptions: labelOptions,
        },
      },
    },
    {
      name: 'Actions',
      type: FieldType.other,
      values: [],
      config: {
        custom: {
          cellOptions: actionOptions,
          align: 'right',
        },
      },
    },
  ];

  // note(bryanhuhta): This is necessary to get the table body to render
  // properly. We don't actually use it to perform any overrides.
  const [dataFrameWithOverrides] = applyFieldOverrides({
    data: [df],
    theme: theme,
    replaceVariables: (value) => value,
    fieldConfig: {
      defaults: {},
      overrides: [],
    },
  });
  return dataFrameWithOverrides;
}
