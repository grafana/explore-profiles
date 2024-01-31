import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

// TODO: migrate Toolbar
import Toolbar from '../../overrides/components/Toolbar';
import { FlameGraph } from '../../shared/components/FlameGraph/FlameGraph';
import { Panel } from '../../shared/components/Panel';
import { QueryBuilder } from '../../shared/components/QueryBuilder/QueryBuilder';
import { addQueryToPageTitle } from '../../shared/domain/addQueryToPageTitle';
import { displayError } from '../../shared/domain/displayError';
import { formatAsOBject } from '../../shared/domain/formatDate';
import { useSingleView } from './domain/useSingleView';
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
    fetchSettingsError,
    settings,
  } = useSingleView();

  if (fetchSettingsError) {
    displayError(fetchSettingsError, [
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <PluginPage layout={PageLayoutType.Custom}>
      <PageTitle title={addQueryToPageTitle('Single', query)} />

      {/* TODO: migrate + add event handlers for services and profile types */}
      <Toolbar />

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
          />
        )}
      </Panel>
    </PluginPage>
  );
}
