import { GetCollectionRuleResponse } from '@shared/pyroscope-api/settings/v1/setting_pb';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import React from 'react';

import { AddRuleModal } from './components/AddRuleModal/AddRuleModal';
import { ViewRule } from './components/ViewRule/ViewRule';
import { useCollectorSettings } from './domain/useCollectorSettings';

export function CollectorSettings() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useCollectorSettings();

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving the collector rules!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <>
      <div className={styles.controls}>
        <div>
          {data.isFetching && <Spinner inline />}
          {!data.isFetching && !data.rules.length && <>No rules found.</>}
        </div>

        <AddRuleModal saveRule={actions.saveRule} existingRuleNames={data.existingRuleNames} />
      </div>

      {!data.isFetching &&
        data.rules &&
        data.rules.map((rule: GetCollectionRuleResponse) => (
          <ViewRule key={rule.name} deleteRule={actions.deleteRule} saveRule={actions.saveRule} rule={rule} />
        ))}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${theme.spacing(2)};
  `,
});
