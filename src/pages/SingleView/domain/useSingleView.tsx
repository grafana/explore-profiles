import { FlameGraphDataContainer, LevelItem } from '@grafana/flamegraph/src/FlameGraph/dataTransform';
import { ClickedItemData } from '@grafana/flamegraph/src/types';
import { useState } from 'react';

import { translatePyroscopeTimeRangeToGrafana } from '../../../shared/domain/translation';
import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchPluginSettings } from '../../../shared/infrastructure/settings/useFetchPluginSettings';
import { vcsClient } from '../../../shared/infrastructure/vcs/HttpClient';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { CodeInfo } from '../ui/CodeContainer';
import { useUserQuery } from './useUserQuery';
import { useUserTimeRange } from './useUserTimeRange';
import { getGithubOAuthToken, loginToGithub, parsePprof, splitQueryProfileTypeAndLabelSelector } from './vcs';

export function useSingleView() {
  const [query, setQuery] = useUserQuery();
  const [timeRange, setTimeRange] = useUserTimeRange();

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  const {
    isFetching,
    error: fetchDataError,
    profile,
    timeline,
    refetch,
  } = useFetchProfileAndTimeline({
    query,
    timeRange,
    maxNodes: settings?.maxNodes,
    enabled: Boolean(settings) || Boolean(fetchSettingsError),
  });

  const isLoading = isFetchingSettings || isFetching;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const onItemFocused = async (data: ClickedItemData, container: FlameGraphDataContainer | undefined) => {
    if (!container) {
      return;
    }

    if (!query || !timeRange.from || !timeRange.until) {
      return;
    }
    const tr = translatePyroscopeTimeRangeToGrafana(timeRange.from, timeRange.until);
    const client = vcsClient;

    let node: LevelItem | undefined = data.item;
    let labels = [];

    while (node) {
      for (const idx of node.itemIndexes) {
        labels.push(container.getLabel(idx));
      }

      node = node.parents?.[0];
    }

    labels = labels.filter((s) => s.localeCompare('total'));
    labels = labels.reverse();

    const [profileType, labelSelector] = splitQueryProfileTypeAndLabelSelector(query);
    const res = await client.selectMergeProfile({
      profileType,
      labelSelector,
      start: Number(tr.from),
      end: Number(tr.to),
      stacktrace: labels,
    });

    let functionDetails = parsePprof(labels[labels.length - 1], res);

    // Pick a "default" function details. For now, just pick first details
    // with version defined (or the first details if none have versions).
    const functionDetailsWithVersions = functionDetails.filter((details) => details.Version() !== undefined);
    if (!functionDetailsWithVersions) {
      console.log("couldn't find versions");
      return;
    }

    const details = functionDetailsWithVersions[0];

    let fn = details.fileName;
    let ref = details.Version()?.git_ref ?? '';
    let repo = details.Version()?.repository ?? '';

    let oauthToken = getGithubOAuthToken();
    if (!oauthToken) {
      await loginToGithub(); // TODO(bryan) set the state to wait for the login flow to finish and get OAuth token.
    }

    let fileRes = await client.getFile({
      repository: repo,
      ref: ref,
      path: fn,
    });

    const url = details.LinkToGithub(fileRes.URL);

    const mappings = details.Map(fileRes.content);
    setCodeInfo({
      gitRef: ref,
      repository: repo,
      filename: fn,
      functionName: details.name,
      code: mappings,
      link: url,
    });
  };
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);

  return {
    data: {
      query,
      timeRange,
      isLoading,
      fetchDataError,
      profile,
      timeline,
      timelinePanelTitle,
      fetchSettingsError,
      settings,
      codeInfo,
    },
    actions: {
      setQuery,
      setTimeRange,
      refetch: () => refetch(),
      onItemFocused,
      closeCodePanel: () => setCodeInfo(null),
    },
  };
}
