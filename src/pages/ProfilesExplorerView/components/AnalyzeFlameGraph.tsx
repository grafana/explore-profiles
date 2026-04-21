import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { t } from '@grafana/i18n';
import { displayError } from '@shared/domain/displayStatus';
import React from 'react';

import { OpenAssistantButtonAsync } from './OpenAssistantButtonAsync';
import { buildPrompts } from './SceneAiPanel/domain/buildLlmPrompts';
import { fetchDotProfiles, FetchParams, validateFetchParams } from './SceneAiPanel/infrastructure/useFetchDotProfiles';

interface AnalyzeFlameGraphProps {
  dataSourceUid: string;
  profileMetricId: string;
  fetchParams: FetchParams;
}

export function AnalyzeFlameGraph({ dataSourceUid, profileMetricId, fetchParams }: AnalyzeFlameGraphProps) {
  const { isAvailable } = useAssistant();

  if (!isAvailable) {
    return null;
  }

  const { error } = validateFetchParams(false, fetchParams);

  if (error) {
    return null;
  }

  return (
    <OpenAssistantButtonAsync
      origin="grafana-pyroscope-app/flame-graph"
      title={t('flame-graph.explain-button', 'Explain Flame Graph')}
      contextProvider={async () => {
        try {
          const { profiles, profileType } = await fetchDotProfiles(false, fetchParams, dataSourceUid, profileMetricId);

          const prompts = buildPrompts({
            system: 'empty',
            user: 'single',
            profileType,
            profiles,
          });

          const context = [
            createAssistantContextItem('datasource', {
              datasourceUid: dataSourceUid,
            }),
            createAssistantContextItem('structured', {
              title: t('analyze-flame-graph.context.title', 'DOT Profile and instructions'),
              data: { stringifiedData: `${prompts.system}\n${prompts.user}` },
            }),
          ];

          return {
            prompt: t('analyze-flame-graph.prompt', 'Analyze this performance profile.'),
            context,
          };
        } catch (error) {
          displayError(error as Error, [t('analyze-flame-graph.error', 'Failed to fetch DOT profile for analysis')]);
          return undefined;
        }
      }}
    />
  );
}
