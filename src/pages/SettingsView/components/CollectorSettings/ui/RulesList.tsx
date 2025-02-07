import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import React from 'react';

import { ViewRule } from '../components/ViewRule/ViewRule';

// TODO: Probably this is too small, merge this into the CollectorSettings
export type RulesListProps = {
  saveRule(rule: UpsertCollectionRuleRequest): Promise<void>;
  deleteRule(ruleName: string): Promise<void>;
  rules: GetCollectionRuleResponse[];
  ruleUncollapsed: string | undefined;
};

export function RulesList(props: RulesListProps) {
  return props.rules.map((rule: GetCollectionRuleResponse) => (
    <ViewRule
      deleteRule={props.deleteRule}
      saveRule={props.saveRule}
      rule={rule}
      collapsed={props.ruleUncollapsed !== rule.name}
      modified={false}
    />
  ));
}
