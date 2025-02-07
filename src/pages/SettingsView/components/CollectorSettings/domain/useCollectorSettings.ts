import {
  DeleteCollectionRuleRequest,
  EBPFSettings,
  GetCollectionRuleResponse,
  JavaSettings,
  ServiceData,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
// TODO: do they have to be in @shared? by which other parts of the app will they be used?
import { CollectorRule, CollectorRulesState } from '@shared/infrastructure/settings/CollectorRules';
import { useFetchCollectorRules } from '@shared/infrastructure/settings/useFetchCollectorRules';
import { DomainHookReturnValueTyped as DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useEffect, useMemo, useState } from 'react';

export function getRule(s: CollectorRulesState, ruleName: string): CollectorRule | undefined {
  return s.data.find((rule) => rule.rule.name === ruleName);
}

export function useCollectorSettings(): DomainHookReturnValue<
  {
    rules: GetCollectionRuleResponse[];
    existingRuleNames: string[];
    isFetching: boolean;
    fetchError: Error | null;
  },
  {
    addRule(ruleName: string): void;
    getRule(ruleName: string): CollectorRule | undefined;
    saveRuleN(rule: UpsertCollectionRuleRequest): Promise<void>;
    saveRule(ruleName: string): Promise<void>;
    deleteRule(ruleName: string): Promise<void>;
  }
> {
  const { rules, isFetching, error: fetchError, mutate, mutateDelete } = useFetchCollectorRules();

  const [currentState, setCurrentState] = useState<CollectorRulesState>({
    data: rules ?? [],
  } as CollectorRulesState);

  const existingRuleNames = useMemo(() => currentState.data.map((r) => r.rule.name), [currentState.data]);

  // TODO: useMemo, because it's not a side effect
  useEffect(() => {
    if (rules) {
      setCurrentState({
        data: [...rules],
      });
    }
  }, [rules]);

  return {
    data: {
      rules: currentState.data.map((r) => r.rule) as GetCollectionRuleResponse[],
      existingRuleNames: existingRuleNames as string[],
      isFetching,
      fetchError,
    },
    actions: {
      getRule(ruleName: string) {
        return getRule(currentState, ruleName);
      },
      addRule(ruleName: string) {
        const rule = this.getRule(ruleName);
        // rule already exists
        if (rule) {
          // TODO: Needs error
          return;
        }

        setCurrentState({
          ...currentState,
          data: [
            ...currentState.data,
            {
              rule: {
                name: ruleName,
                services: [] as ServiceData[],
                java: { enabled: true } as JavaSettings,
                ebpf: { enabled: true } as EBPFSettings,
              } as GetCollectionRuleResponse,
              modified: true,
            },
          ],
        });
      },
      async saveRule(ruleName: string) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }

        await this.saveRuleN({
          name: rule.rule.name,
          ebpf: rule.rule.ebpf,
          java: rule.rule.java,
          services: rule.rule.services,
        } as UpsertCollectionRuleRequest);
      },
      async saveRuleN(rule: UpsertCollectionRuleRequest) {
        try {
          const newRule = await mutate(rule);

          const exists = currentState.data.find((r) => r.rule.name === rule.name) !== undefined;

          if (!exists) {
            setCurrentState({
              ...currentState,
              data: currentState.data.concat([
                {
                  modified: false,
                  rule: newRule,
                },
              ]),
            });

            return;
          }

          setCurrentState({
            ...currentState,
            data: currentState.data.map((r) =>
              r.rule.name === rule.name
                ? {
                    ...r,
                    rule: newRule,
                    modified: false,
                  }
                : r
            ),
          });

          displaySuccess(['Rule successfully saved!']);
        } catch (error) {
          displayError(error as Error, [
            'Error while saving the collector rule!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
      async deleteRule(ruleName: string) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }

        try {
          // only delete if it has been saved
          if (rule.rule.lastUpdated > 0) {
            await mutateDelete({
              name: rule.rule.name,
            } as DeleteCollectionRuleRequest);
          }
          setCurrentState({
            ...currentState,
            data: currentState.data.filter((r) => r.rule.name !== ruleName),
          });
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
