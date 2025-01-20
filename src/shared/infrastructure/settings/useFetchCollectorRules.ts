import {
  CollectionRulesService,
  DeleteCollectionRuleRequest,
  DeleteCollectionRuleResponse,
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { useMutation, useQuery } from '@connectrpc/connect-query';
import { useMemo } from 'react';

import { CollectorRule, CollectorRules } from './CollectorRules';

type FetchParams = {};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  rules?: CollectorRules;
  mutate: (rule: UpsertCollectionRuleRequest) => Promise<GetCollectionRuleResponse>;
  mutateDelete: (rule: DeleteCollectionRuleRequest) => Promise<DeleteCollectionRuleResponse>;
};

/**
 * Fetches the plugin settings and, if none/only some have been stored previously, returns adequate default values for the rest of the application
 */
export function useFetchCollectorRules({}: FetchParams = {}): FetchResponse {
  const { isFetching, error, data } = useQuery(CollectionRulesService.method.listCollectionRules, {});

  const rules = useMemo(
    () =>
      data
        ? data.rules.map((r) => {
            return {
              rule: r,
              modified: false,
            } as CollectorRule;
          })
        : undefined,
    [data]
  );

  const { mutateAsync: mutate } = useMutation(CollectionRulesService.method.upsertCollectionRule, {});

  const { mutateAsync: mutateDelete } = useMutation(CollectionRulesService.method.deleteCollectionRule, {});

  return {
    isFetching,
    error,
    rules,
    mutate,
    mutateDelete,
  };
}
