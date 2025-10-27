import { css } from '@emotion/css';
import { Column, EmptyState, Icon, InteractiveTable, TagList, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { BackButton } from '@shared/components/Common/BackButton';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { HttpClientError } from '@shared/infrastructure/http/HttpClientError';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { RecordingRuleViewModel } from '@shared/types/RecordingRuleViewModel';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { EmptyLoadingPage } from '../../app/components/Onboarding/ui/EmptyLoadingPage';
import { DeleteRecordingRuleButton } from './DeleteRecordingRuleButton';
import { useRecordingRulesView } from './domain/useRecordingRulesView';

const RecordingRulesDetails = (model: RecordingRuleViewModel) => {
  const { matchers, readonly } = model;

  let labels: string[] = [];

  matchers.forEach((matcher) => {
    const p = parseQuery(matcher);

    labels = [...labels, ...p.labels.filter((label) => !label.trim().match(/^__profile_type__/))];
  });

  let matchersContent = <span>No labels</span>;

  if (labels.length !== 0) {
    matchersContent = <span className={css({ fontFamily: 'monospace' })}>{labels.join(', ')}</span>;
  }

  return (
    <div>
      <dl>
        <dt>Filters</dt>
        <dd>{matchersContent}</dd>
        <dt>Read only</dt>
        <dd>{readonly ? 'Yes' : 'No'}</dd>
      </dl>
    </div>
  );
};

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
      cell: (props) => {
        const rule: RecordingRuleViewModel = props.row.original;
        return (
          rule.serviceName || (
            <Text element="span" color="secondary">
              All services
            </Text>
          )
        );
      },
    },
    {
      id: 'profileType',
      header: 'Profile Type',
      sortType: 'alphanumeric',
    },
    {
      id: 'functionName',
      header: 'Function Name',
      sortType: 'alphanumeric',
      cell: (props) => {
        const rule: RecordingRuleViewModel = props.row.original;
        return (
          rule.functionName || (
            <Text element="span" color="secondary">
              Total (all functions)
            </Text>
          )
        );
      },
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
        if (rule.readonly) {
          return (
            <Tooltip content="This rule is provisioned with tenant settings and cannot be deleted.">
              <Icon name="info-circle" />
            </Tooltip>
          );
        } else {
          return <DeleteRecordingRuleButton rule={rule} confirm={() => actions.removeRecordingRule(rule)} />;
        }
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

  let component = null;

  if (data.fetchError) {
    component = <RecordingRulesViewError error={data.fetchError} />;
  } else if (isEmpty) {
    component = (
      <EmptyState message={'No recording rules'} variant="not-found" button={<BackButton />}>
        Open a flame graph, click on the &quot;total&quot; block at the top and select &quot;Create recording rule&quot;
        from the context menu to define a new rule.
      </EmptyState>
    );
  } else {
    component = (
      <div>
        <InteractiveTable
          className={css({ marginBottom: '32px' })}
          columns={columns}
          pageSize={10}
          data={formattedRules || []}
          getRowId={(rule) => rule.id}
          renderExpandedRow={RecordingRulesDetails}
        ></InteractiveTable>
        <BackButton />
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

function RecordingRulesViewError({ error }: { error: HttpClientError }) {
  let errorMessage = 'Error while retrieving recording rules';
  if (error.response?.status === 404) {
    errorMessage = 'This feature requires Pyroscope with recording_rules flag enabled.';
  } else if (error.message) {
    errorMessage = error.message;
  }
  return (
    <EmptyState message="Error while retrieving recording rules" variant="not-found" button={<BackButton />}>
      {errorMessage}
    </EmptyState>
  );
}
