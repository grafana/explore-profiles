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
  Text,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { Metric } from '@shared/infrastructure/metrics/Metric';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useMetricsView } from './domain/useMetricsView';

type DeleteFn = (metric: Metric) => Promise<void>;

export default function MetricsView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useMetricsView();
  const { metrics } = data;

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving created metrics!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  // This is a bit of a hack to calculate the max width of the table since the
  // Table api requires a fixed width value. Here we subtract a fixed amount
  // from the window width to account for the sidebar.
  const width = window.innerWidth - 400;
  const theme = useTheme2();
  const dataFrame = metrics !== undefined ? buildDataFrame(metrics, theme, width, styles, actions.removeMetric) : null;

  return (
    <>
      <PageTitle title="Created metrics" />
      {dataFrame && (
        <Table
          data={dataFrame}
          width={width}
          height={500}
          columnMinWidth={130}
          cellHeight={TableCellHeight.Lg}
          resizable={false}
          initialSortBy={[{ displayName: 'Name' }]}
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

function buildDataFrame(
  metrics: Metric[],
  theme: GrafanaTheme2,
  tableWidth: number,
  styles: Record<string, any>,
  onDelete: DeleteFn
): DataFrame {
  const df = arrayToDataFrame(
    metrics.map((m) => {
      const profileType = getProfileMetric(m.profileType as ProfileMetricId);

      return {
        Name: m.name,
        'Service Name': m.serviceName,
        'Profile Type': `${profileType.group}/${profileType.type}`,
      };
    })
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
      // Exclude hidden labels.
      const labels = metrics[props.rowIndex]?.labels?.filter((label: string) => !label.match(/^__\S+__$/));

      if (!labels || labels.length === 0) {
        return (
          <Text element="span" color="secondary">
            None
          </Text>
        );
      }

      return <TagList className={styles.tagList} displayMax={4} tags={labels} />;
    },
  };

  const actionOptions: TableCustomCellOptions = {
    type: TableCellDisplayMode.Custom,
    cellComponent: (props) => {
      const name = props.frame.fields.find((f) => f.name === 'Name')?.values[props.rowIndex];
      const label = name ? `Delete ${name}` : 'Delete metric';

      // todo(bryan): Make this a confirmation modal.
      return (
        <IconButton
          name="trash-alt"
          variant="destructive"
          aria-label={label}
          tooltip={label}
          onClick={() => onDelete(metrics[props.rowIndex])}
        />
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

  const colWidthPercentages = [
    0.2, // Name
    0.1, // Service name
    0.2, // Profile type
    0.1, // Data source
    0.25, // Labels
    0.05, // Actions
  ];

  // Remap all the column widths.
  df.fields = df.fields.map((f, i) => {
    const width = tableWidth * colWidthPercentages[i];
    return {
      ...f,
      config: {
        ...f.config,
        custom: {
          ...f.config.custom,
          width,
        },
      },
    };
  });

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
