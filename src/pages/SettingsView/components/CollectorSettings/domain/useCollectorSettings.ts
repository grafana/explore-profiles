import {
  DeleteCollectionRuleRequest,
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@shared/pyroscope-api/settings/v1/setting_pb';
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { DomainHookReturnValueTyped as DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useEffect, useMemo, useState } from 'react';

import { useFetchCollectorRules } from './useFetchCollectorRules';

export function useCollectorSettings(): DomainHookReturnValue<
  {
    rules: GetCollectionRuleResponse[];
    existingRuleNames: string[];
    isFetching: boolean;
    fetchError: Error | null;
  },
  {
    saveRule(rule: UpsertCollectionRuleRequest): Promise<void>;
    deleteRule(ruleName: string): Promise<void>;
  }
> {
  const { rules, isFetching, error: fetchError, upsertAsync, deleteAsync } = useFetchCollectorRules();

  const [currentState, setCurrentState] = useState<GetCollectionRuleResponse[]>(rules ?? []);
  const existingRuleNames = useMemo(() => currentState.map((r) => r.name), [currentState]);

  // TODO: useMemo, because it's not a side effect
  useEffect(() => {
    if (rules) {
      setCurrentState([...rules]);
    }
  }, [rules]);

  return {
    data: {
      rules: currentState,
      existingRuleNames: existingRuleNames as string[],
      isFetching,
      fetchError,
    },
    actions: {
      async saveRule(rule: UpsertCollectionRuleRequest) {
        try {
          const newRule = await upsertAsync(rule);

          const exists = currentState.find((r) => r.name === rule.name) !== undefined;

          if (!exists) {
            setCurrentState(currentState.concat([newRule]));
            return;
          }

          setCurrentState(
            currentState.map((r) =>
              r.name === rule.name
                ? {
                    ...r,
                    ...newRule,
                  }
                : r
            )
          );

          displaySuccess(['Rule successfully saved!']);
        } catch (error) {
          displayError(error as Error, [
            'Error while saving the collector rule!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
      async deleteRule(ruleName: string) {
        try {
          // only delete if it has been saved
          await deleteAsync({
            name: ruleName,
          } as DeleteCollectionRuleRequest);
          setCurrentState(currentState.filter((r) => r.name !== ruleName));
          displaySuccess(['Rule successfully deleted!']);
        } catch (error) {
          displayError(error as Error, [
            'Error while deleting the collector rule!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
    },
  };
}
