import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FlameGraphWrapper } from '../../overrides/components/FlameGraphWrapper';
import { Panel } from '../../overrides/components/Panel';
import TagsBar from '../../overrides/components/TagsBar';
import Toolbar from '../../overrides/components/Toolbar';
import { addQueryToPageTitle } from '../../shared/ui/addQueryToPageTitle';
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

  const { query, setQuery, setTimeRange, isLoading, error, profile, timeline, timelinePanelTitle } = useSingleView();

  return (
    <PluginPage layout={PageLayoutType.Custom}>
      <PageTitle title={addQueryToPageTitle('Single', query)} />

      {/* TODO: add event handlers for services and profile types */}
      <Toolbar />
      <TagsBar query={query} onSetQuery={setQuery} />

      <Panel title={timelinePanelTitle} isLoading={isLoading} className={styles.timelinePanel}>
        {error && <ErrorMessage title="Error while loading timeline data!" error={error} />}
        {timeline && <Timeline timeline={timeline} onSelectTimeRange={setTimeRange} />}
      </Panel>

      <Panel isLoading={isLoading}>
        {error && <ErrorMessage title="Error while loading flamegraph data!" error={error} />}
        {profile && <FlameGraphWrapper profile={profile} />}
      </Panel>
    </PluginPage>
  );
}
