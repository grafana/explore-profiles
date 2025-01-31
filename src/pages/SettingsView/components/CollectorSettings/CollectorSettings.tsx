import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import React, { useState } from 'react';

import { AddRuleModal } from './components/AddRuleModal/AddRuleModal';
import { useCollectorSettings } from './domain/useCollectorSettings';
import { RulesList } from './ui/RulesList';

export function CollectorSettings() {
  const styles = useStyles2(getStyles);
  const controller = useCollectorSettings();

  const { isFetching, data, fetchError } = controller;

  // TODO: move to useCollectorSettings
  const [ruleUncollapsed, setRuleUncollapsed] = useState<string | undefined>(undefined);
  // TODO: move to useCollectorSettings
  const addNewRule = (ruleName: string) => {
    setRuleUncollapsed(ruleName);
    controller.actions.addRule(ruleName);
  };

  if (fetchError) {
    displayError(fetchError, [
      'Error while retrieving the collector rules!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <>
      <div className={styles.controls}>
        <div>
          {isFetching && <Spinner inline />}
          {!isFetching && !data.data.length && <>No rules found.</>}
        </div>

        <AddRuleModal saveRule={controller.actions.saveRuleN} />
      </div>

      {/* TODO: data is part of controller, pass only the props that are needed + move some logic from useCollectorSettings() to a new domain hook in RulesList or below */}
      {!isFetching && <RulesList controller={controller} data={data} ruleUncollapsed={ruleUncollapsed} />}
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
