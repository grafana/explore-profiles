import React, { useMemo } from 'react';

import { CollectorRuleView } from '../components/CollectorRuleView';

export type RulesListProps = any;

export function RulesList({ controller, data, ruleUncollapsed }: RulesListProps) {
  const ruleNames = useMemo(() => data.data.map((r: any) => r.rule.name), [data]);

  return ruleNames.map((name: any) => (
    <CollectorRuleView key={name} controller={controller} ruleName={name} collapsed={ruleUncollapsed !== name} />
  ));
}
