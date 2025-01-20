import { GetCollectionRuleResponse } from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';

export type CollectorRule = {
  rule: GetCollectionRuleResponse;
  modified: boolean;
};

export type CollectorRules = CollectorRule[];

export type CollectorRulesState = {
  data: CollectorRules;
};
