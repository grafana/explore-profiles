import { css } from '@emotion/css';
import { createAssistantContextItem, OpenAssistantButton, useAssistant } from '@grafana/assistant';
import { Spinner } from '@grafana/ui';
import React from 'react';

import { buildPrompts } from './SceneAiPanel/domain/buildLlmPrompts';
import { FetchParams, useFetchDotProfiles } from './SceneAiPanel/infrastructure/useFetchDotProfiles';

interface AnalyzeDiffFlameGraphProps {
  dataSourceUid: string;
  profileMetricId: string;
  isDiff: boolean;
  fetchParams: FetchParams;
}

export function AnalyzeDiffFlameGraph({
  dataSourceUid,
  profileMetricId,
  isDiff,
  fetchParams,
}: AnalyzeDiffFlameGraphProps) {
  const { isAvailable } = useAssistant();

  const { profileType, profiles, validationError, fetchError, isFetching } = useFetchDotProfiles(
    isDiff,
    fetchParams,
    dataSourceUid,
    profileMetricId
  );

  if (!isAvailable) {
    return null;
  }

  if (validationError || fetchError) {
    return null;
  }

  if (!isFetching && profileType && profiles) {
    const prompts = buildPrompts({
      system: 'empty',
      user: 'diff',
      profileType,
      profiles,
    });

    const context = [
      createAssistantContextItem('datasource', {
        datasourceUid: dataSourceUid,
      }),
      createAssistantContextItem('structured', {
        title: 'DOT Profiles and instructions',
        data: { stringifiedData: `${prompts.system}\n${prompts.user}` },
      }),
    ];

    return (
      <div className={css({ marginTop: '10px' })}>
        <OpenAssistantButton
          origin="grafana/diff-flame-graph"
          prompt={`Analyze the differences between these two performance profiles.`}
          context={context}
        />
      </div>
    );
  }

  return <Spinner />;
}
