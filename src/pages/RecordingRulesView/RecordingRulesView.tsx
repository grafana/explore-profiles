import { css } from '@emotion/css';
import { Button, Column, DeleteButton, EmptyState, InteractiveTable, TagList, Text, useStyles2 } from '@grafana/ui';
import { HttpClientError } from '@shared/infrastructure/http/HttpClientError';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { EmptyLoadingPage } from '../../app/components/Onboarding/ui/EmptyLoadingPage';
import { RecordingRuleViewModel } from './domain/RecordingRuleViewModel';
import { useRecordingRulesView } from './domain/useRecordingRulesView';

export default function RecordingRulesView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useRecordingRulesView();
  const { recordingRules } = data;

  if (data.isFetching) {
    return <EmptyLoadingPage />;
  }

  const columns: Array<Column<RecordingRuleViewModel>> = [
    {
      id: 'metricName',
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
      id: 'groupBy',
      header: 'Labels',
      cell: (props) => {
        // Exclude hidden labels.
        const rule: RecordingRuleViewModel = props.row.original;
        const labels = rule.groupBy?.filter((label: string) => !label.match(/^__\S+__$/));

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
        const rule: RecordingRuleViewModel = props.row.original;
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

  let component = null;

  if (data.fetchError) {
    component = <RecordingRulesViewError error={data.fetchError} backButton={backButton} />;
  } else if (isEmpty) {
    component = (
      <EmptyState message={'No recording rules'} variant="not-found" button={backButton}>
        Open a flame graph, click on the &quot;total&quot; block at the top and select &quot;Create recording rule&quot;
        from the context menu to define a new rule.
      </EmptyState>
    );
  } else {
    component = (
      <div>
        <InteractiveTable
          columns={columns}
          pageSize={10}
          data={formattedRules || []}
          getRowId={(rule) => rule.metricName}
        ></InteractiveTable>
        {backButton}
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Recording rules" />
      {component}
    </>
  );
}

const getStyles = () => ({
  tagList: css`
    flex-direction: row;
    justify-content: start;
  `,
});

function RecordingRulesViewError({ error, backButton }: { error: HttpClientError; backButton: React.ReactNode }) {
  let errorMessage = 'Error while retrieving recording rules';
  if (error.response?.status === 404) {
    errorMessage = 'This features require Pyroscope with recording_rules flag enabled.';
  } else if (error.message) {
    errorMessage = error.message;
  }
  return (
    <EmptyState message="Error while retrieving recording rules" variant="not-found" button={backButton}>
      {errorMessage}
    </EmptyState>
  );
}
