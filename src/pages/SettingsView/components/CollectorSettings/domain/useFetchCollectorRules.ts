import {
  CollectionRulesService,
  DeleteCollectionRuleRequest,
  DeleteCollectionRuleResponse,
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@shared/pyroscope-api/settings/v1/setting_pb';
import { useMutation, useQuery } from '@connectrpc/connect-query';
import { useMemo } from 'react';

type FetchParams = {};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  rules?: GetCollectionRuleResponse[];
  upsertAsync: (rule: UpsertCollectionRuleRequest) => Promise<GetCollectionRuleResponse>;
  deleteAsync: (rule: DeleteCollectionRuleRequest) => Promise<DeleteCollectionRuleResponse>;
};

export function useFetchCollectorRules({}: FetchParams = {}): FetchResponse {
  const { isFetching, error, data } = useQuery(CollectionRulesService.method.listCollectionRules, {});

  const rules = useMemo(() => (data ? data.rules : undefined), [data]);

  const { mutateAsync: upsertAsync } = useMutation(CollectionRulesService.method.upsertCollectionRule, {});

  const { mutateAsync: deleteAsync } = useMutation(CollectionRulesService.method.deleteCollectionRule, {});

  return {
    isFetching,
    error,
    rules,
    upsertAsync,
    deleteAsync,
  };
}
