import { Space } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import React, { useMemo, useState } from 'react';

import { AddRuleModal } from './AddRuleModal';
import { CollectorRuleView } from './CollectorRuleView';
import { useCollectorRulesView } from './domain/useCollectorRulesView';

export function CollectorSettingsView() {
  const controller = useCollectorRulesView();

  const { isFetching, data, fetchError } = controller;

  const [ruleUncollapsed, setRuleUncollapsed] = useState<string | undefined>(undefined);

  const ruleNames = useMemo(() => data.data.map((r) => r.rule.name), [data]);

  if (fetchError) {
    displayError(fetchError, [
      'Error while retrieving the collector plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <>
      <AddRuleModal
        onRuleAdd={(ruleName: string) => {
          setRuleUncollapsed(ruleName);
          controller.actions.addRule(ruleName);
        }}
      />
      <Space v={2} />
      {!isFetching &&
        ruleNames.map((name) => (
          <CollectorRuleView key={name} controller={controller} ruleName={name} collapsed={ruleUncollapsed !== name} />
        ))}
    </>
  );
}
