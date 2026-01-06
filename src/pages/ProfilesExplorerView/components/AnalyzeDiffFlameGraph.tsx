import { css } from '@emotion/css';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { displayError } from '@shared/domain/displayStatus';
import React from 'react';

import { OpenAssistantButtonAsync } from './OpenAssistantButtonAsync';
import { buildPrompts } from './SceneAiPanel/domain/buildLlmPrompts';
import { fetchDotProfiles, FetchParams, validateFetchParams } from './SceneAiPanel/infrastructure/useFetchDotProfiles';

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

  if (!isAvailable) {
    return null;
  }

  const { error } = validateFetchParams(true, fetchParams);

  if (error) {
    return null;
  }

  return (
    <div className={css({ marginTop: '10px' })}>
      <OpenAssistantButtonAsync
        origin="grafana/diff-flame-graph"
        contextProvider={async () => {
          try {
            const { profiles, profileType } = await fetchDotProfiles(
              isDiff,
              fetchParams,
              dataSourceUid,
              profileMetricId
            );

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

            return {
              prompt: 'Analyze the differences between these two performance profiles.',
              context,
            };
          } catch (error) {
            displayError(error as Error, ['Failed to fetch DOT profiles for analysis']);
            return undefined;
          }
        }}
      />
    </div>
  );
}
