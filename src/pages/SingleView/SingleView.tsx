import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { IconButton, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import { FlameGraph } from '../../shared/components/FlameGraph/FlameGraph';
import { Panel } from '../../shared/components/Panel';
import { QueryBuilder } from '../../shared/components/QueryBuilder/QueryBuilder';
import { Toolbar } from '../../shared/components/Toolbar/Toolbar';
import { addQueryToPageTitle } from '../../shared/domain/addQueryToPageTitle';
import { displayError } from '../../shared/domain/displayError';
import { formatAsOBject } from '../../shared/domain/formatDate';
import { useSingleView } from './domain/useSingleView';
import { CodeContainer } from './ui/CodeContainer';
import { SuggestionsContainer } from './ui/SuggestionsContainer';
import { ErrorMessage } from './ui/ErrorMessage';
import { PageTitle } from './ui/PageTitle';
import { Timeline } from './ui/Timeline';

const getStyles = () => ({
  timelinePanel: css`
    & > div {
      min-height: 250px;
    }
  `,
  codeContainer: css`
    width: 50%;
    padding-left: 8px;
  `,
  flex: css`
    display: flex;
  `,
  flamegraphPanel: css`
    min-width: 0;
    flex-grow: 1;
  `,
});

export function SingleView() {
  const { data, actions } = useSingleView();
  const styles = useStyles2(getStyles);

  if (data.fetchSettingsError) {
    displayError(data.fetchSettingsError, [
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const [showSuggestions, setShowSuggestions] = useState(false);

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
      <div className={styles.flex}>
        <Panel isLoading={data.isLoading} className={styles.flamegraphPanel}>
          {data.fetchDataError && (
            <ErrorMessage title="Error while loading flamegraph data!" error={data.fetchDataError} />
          )}
          {data.profile && (
            <FlameGraph
              profile={data.profile}
              enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
              collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
              onItemFocused={actions.onItemFocused}
            />
          )}
        </Panel>

        {data.codeInfo && (
          <Panel
            isLoading={false}
            className={styles.codeContainer}
            title="Function Details"
            headerActions={
              <IconButton name="times-circle" variant="secondary" aria-label="close" onClick={actions.closeCodePanel} />
            }
          >
            <CodeContainer codeInfo={data.codeInfo} onSuggestionsClick={function(){
              setShowSuggestions(true);
            }} />
          </Panel>
        )}

        {data.codeInfo && showSuggestions && (
          <Panel
            isLoading={false}
            className={styles.codeContainer}
            title="Optimization Assistant"
            headerActions={
              <IconButton name="times-circle" variant="secondary" aria-label="close" onClick={actions.closeCodePanel} />
            }
          >
            <SuggestionsContainer codeInfo={data.codeInfo}  />
          </Panel>
        )}
      </div>
    </PluginPage>
  );
}
