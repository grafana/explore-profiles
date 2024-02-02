import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React from 'react';

import { FlameGraph } from '../../shared/components/FlameGraph/FlameGraph';
import { Panel } from '../../shared/components/Panel';
import { QueryBuilder } from '../../shared/components/QueryBuilder/QueryBuilder';
import { Toolbar } from '../../shared/components/Toolbar/Toolbar';
import { addQueryToPageTitle } from '../../shared/domain/addQueryToPageTitle';
import { displayError } from '../../shared/domain/displayError';
import { formatAsOBject } from '../../shared/domain/formatDate';
import { useSingleView } from './domain/useSingleView';
import { ErrorMessage } from './ui/ErrorMessage';
import { PageTitle } from './ui/PageTitle';
import { Timeline } from './ui/Timeline';

export function SingleView() {
  const { data, actions } = useSingleView();

  if (data.fetchSettingsError) {
    displayError(data.fetchSettingsError, [
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <PluginPage layout={PageLayoutType.Custom}>
      <PageTitle title={addQueryToPageTitle('Single', data.query)} />

      <Toolbar
        isLoading={data.isLoading}
        timeRange={data.timeRange}
        onRefresh={actions.refetch}
        onChangeTimeRange={actions.setTimeRange}
      />

      <QueryBuilder
        id="query-builder-single"
        query={data.query}
        // every time this component re-renders, we might pass new timerange values ;)
        from={formatAsOBject(data.timeRange.from).getTime()}
        until={formatAsOBject(data.timeRange.until).getTime()}
        onChangeQuery={actions.setQuery}
      />

      <Panel title={data.timelinePanelTitle} isLoading={data.isLoading}>
        {data.fetchDataError && <ErrorMessage title="Error while loading timeline data!" error={data.fetchDataError} />}
        {data.timeline && (
          <Timeline timeRange={data.timeRange} timeline={data.timeline} onSelectTimeRange={actions.setTimeRange} />
        )}
      </Panel>

      <Panel isLoading={data.isLoading}>
        {data.fetchDataError && (
          <ErrorMessage title="Error while loading flamegraph data!" error={data.fetchDataError} />
        )}
        {data.profile && (
          <FlameGraph
            profile={data.profile}
            enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
            collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
          />
        )}
      </Panel>
    </PluginPage>
  );
}
