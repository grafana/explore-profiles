import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { FlameGraphDataContainer, LevelItem } from '@grafana/flamegraph/src/FlameGraph/dataTransform';
import { ClickedItemData } from '@grafana/flamegraph/src/types';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FlameGraph } from '../../shared/components/FlameGraph/FlameGraph';
import { Panel } from '../../shared/components/Panel';
import { QueryBuilder } from '../../shared/components/QueryBuilder/QueryBuilder';
import { Toolbar } from '../../shared/components/Toolbar/Toolbar';
import { addQueryToPageTitle } from '../../shared/domain/addQueryToPageTitle';
import { displayError } from '../../shared/domain/displayError';
import { formatAsOBject } from '../../shared/domain/formatDate';
import { vcsClient } from '../../shared/infrastructure/vcs/HttpClient';
import { useSingleView } from './domain/useSingleView';
import { getGithubOAuthToken, loginToGithub, parsePprof, splitQueryProfileTypeAndLabelSelector } from './domain/vcs';
import { ErrorMessage } from './ui/ErrorMessage';
import { PageTitle } from './ui/PageTitle';
import { Timeline } from './ui/Timeline';

const getStyles = () => ({
  timelinePanel: css`
    & > div {
      min-height: 250px;
    }
  `,
});

export function SingleView() {
  const styles = useStyles2(getStyles);

  const {
    query,
    setQuery,
    timeRange,
    setTimeRange,
    isLoading,
    fetchDataError,
    profile,
    timeline,
    timelinePanelTitle,
    refetch,
    fetchSettingsError,
    settings,
  } = useSingleView();

  if (fetchSettingsError) {
    displayError(fetchSettingsError, [
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }
  const onItemFocused = async (data: ClickedItemData, container: FlameGraphDataContainer | undefined) => {
    if (!container) {
      return;
    }

    if (!query || !timeRange.from || !timeRange.until) {
      return;
    }

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
      start: Number(timeRange.from),
      end: Number(timeRange.until),
      stacktrace: labels,
    });

    let functionDetails = parsePprof(labels[labels.length - 1], res);

    console.log(functionDetails);

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

    const mappings = details.Map(fileRes.content);
    console.log(mappings);
    // todo: set the drawer state
    // props.setDrawerState?.({
    //   gitRef: ref,
    //   repository: repo,
    //   filename: fn,
    //   functionName: details.name,
    //   code: mappings,
    // });
  };

  return (
    <PluginPage layout={PageLayoutType.Custom}>
      <PageTitle title={addQueryToPageTitle('Single', query)} />

      <Toolbar isLoading={isLoading} timeRange={timeRange} onRefresh={refetch} onChangeTimeRange={setTimeRange} />

      <QueryBuilder
        id="query-builder-single"
        query={query}
        // every time this component re-renders, we might pass new timerange values ;)
        from={formatAsOBject(timeRange.from).getTime()}
        until={formatAsOBject(timeRange.until).getTime()}
        onChangeQuery={setQuery}
      />

      <Panel title={timelinePanelTitle} isLoading={isLoading} className={styles.timelinePanel}>
        {fetchDataError && <ErrorMessage title="Error while loading timeline data!" error={fetchDataError} />}
        {timeline && <Timeline timeline={timeline} onSelectTimeRange={setTimeRange} />}
      </Panel>

      <Panel isLoading={isLoading}>
        {fetchDataError && <ErrorMessage title="Error while loading flamegraph data!" error={fetchDataError} />}
        {profile && (
          <FlameGraph
            profile={profile}
            enableFlameGraphDotComExport={settings?.enableFlameGraphDotComExport}
            collapsedFlamegraphs={settings?.collapsedFlamegraphs}
            onItemFocused={onItemFocused}
          />
        )}
      </Panel>
    </PluginPage>
  );
}
