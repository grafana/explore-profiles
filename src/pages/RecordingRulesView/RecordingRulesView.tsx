import { css } from '@emotion/css';
import { Button, Column, DeleteButton, EmptyState, InteractiveTable, TagList, Text, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { RecordingRule } from '@shared/infrastructure/recording-rules/RecordingRule';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useRecordingRulesView } from './domain/useRecordingRulesView';

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

  if (data.isFetching) {
    return '';
  }

  const columns: Array<Column<RecordingRule>> = [
    {
      id: 'name',
      header: 'Name',
      sortType: 'alphanumeric',
    },
    {
      id: 'serviceName',
      header: 'Service Name',
      sortType: 'alphanumeric',
    },
    {
      id: 'profileType',
      header: 'Profile Type',
      sortType: 'alphanumeric',
    },
    {
      id: 'labels',
      header: 'Labels',
      cell: (props) => {
        // Exclude hidden labels.
        const rule: RecordingRule = props.row.original;
        const labels = rule.labels?.filter((label: string) => !label.match(/^__\S+__$/));

        if (!labels || labels.length === 0) {
          return (
            <Text element="span" color="secondary">
              None
            </Text>
          );
        }

        return <TagList className={styles.tagList} displayMax={4} tags={labels} />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      disableGrow: true,
      cell: (props) => {
        const rule: RecordingRule = props.row.original;
        return <DeleteButton onConfirm={() => actions.removeRecordingRule(rule)} />;
      },
    },
  ];

  const formattedRules = (recordingRules || []).map((rule) => {
    const profileType = getProfileMetric(rule.profileType as ProfileMetricId);
    return {
      ...rule,
      profileType: `${profileType.group}/${profileType.type}`,
    };
  });

  const isEmpty = !formattedRules || formattedRules.length === 0;

  const backButton = (
    <Button
      className={css({ marginTop: '32px' })}
      variant="secondary"
      onClick={() => history.back()}
      aria-label="Back to Profiles Drilldown"
    >
      Back to Profiles Drilldown
    </Button>
  );

  return (
    <>
      <PageTitle title="Recording rules" />

      {isEmpty && (
        <EmptyState message={'No recording rules'} variant="not-found">
          <div>
            Open a flame graph, click on the &quot;total&quot; block at the top and select &quot;Create recording
            rule&quot; from the context menu to define a new rule.
          </div>
          {backButton}
        </EmptyState>
      )}
      {!isEmpty && (
        <div>
          <InteractiveTable
            columns={columns}
            pageSize={10}
            data={formattedRules || []}
            getRowId={(rule) => rule.name}
          ></InteractiveTable>
          {backButton}
        </div>
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
