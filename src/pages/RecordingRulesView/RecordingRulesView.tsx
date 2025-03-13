import { css } from '@emotion/css';
import { applyFieldOverrides, arrayToDataFrame, DataFrame, FieldType, GrafanaTheme2 } from '@grafana/data';
import { TableCellHeight } from '@grafana/schema';
import {
  Button,
  IconButton,
  Table,
  TableCellDisplayMode,
  TableCustomCellOptions,
  TagList,
  Text,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { RecordingRule } from '@shared/infrastructure/recording-rules/RecordingRule';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useRecordingRulesView } from './domain/useRecordingRulesView';

type DeleteFn = (rule: RecordingRule) => Promise<void>;

export default function RecordingRulesView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useRecordingRulesView();
  const { recordingRules } = data;

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving recording rules!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  // This is a bit of a hack to calculate the max width of the table since the
  // Table api requires a fixed width value. Here we subtract a fixed amount
  // from the window width to account for the sidebar.
  const width = window.innerWidth - 400;
  const theme = useTheme2();
  const dataFrame =
    recordingRules !== undefined
      ? buildDataFrame(recordingRules, theme, width, styles, actions.removeRecordingRule)
      : null;

  return (
    <>
      <PageTitle title="Recording rules" />
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
      <Button variant="secondary" onClick={() => history.back()} aria-label="Back to Profiles Drilldown">
        Back to Profiles Drilldown
      </Button>
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
  rules: RecordingRule[],
  theme: GrafanaTheme2,
  tableWidth: number,
  styles: Record<string, any>,
  onDelete: DeleteFn
): DataFrame {
  const df = arrayToDataFrame(
    rules.map((r) => {
      const profileType = getProfileMetric(r.profileType as ProfileMetricId);

      return {
        Name: r.name,
        'Service Name': r.serviceName,
        'Profile Type': `${profileType.group}/${profileType.type}`,
      };
    })
  );

  const labelOptions: TableCustomCellOptions = {
    type: TableCellDisplayMode.Custom,
    cellComponent: (props) => {
      // Exclude hidden labels.
      const labels = rules[props.rowIndex]?.labels?.filter((label: string) => !label.match(/^__\S+__$/));

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
      const label = name ? `Delete ${name}` : 'Delete recording rule';

      // todo(bryan): Make this a confirmation modal.
      return (
        <IconButton
          name="trash-alt"
          variant="destructive"
          aria-label={label}
          tooltip={label}
          onClick={() => onDelete(rules[props.rowIndex])}
        />
      );
    },
  };

  df.fields = [
    ...df.fields,
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
    0.15, // Service name
    0.2, // Profile type
    0.3, // Labels
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
