import {
  DeleteCollectionRuleRequest,
  EBPFSettings,
  GetCollectionRuleResponse,
  JavaSettings,
  ServiceData,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { CollectorRule, CollectorRulesState } from '@shared/infrastructure/settings/CollectorRules';
import { useFetchCollectorRules } from '@shared/infrastructure/settings/useFetchCollectorRules';
import { useEffect, useState } from 'react';

export interface CollectorRulesController {
  actions: CollectorRulesActions;
  data: CollectorRulesState;
  isFetching: boolean;
  fetchError: Error | null;
}

export interface CollectorRulesActions {
  addRule: (ruleName: string) => void;
  getRule: (ruleName: string) => CollectorRule | undefined;
  saveRule: (ruleName: string) => Promise<void>;
  deleteRule: (ruleName: string) => Promise<void>;
  updateServiceEnabled: (ruleName: string, serviceName: string, enabled: boolean) => void;
  removeService: (ruleName: string, serviceName: string) => void;
  updateJavaCollectionEnabled: (ruleName: string, enabled: boolean) => void;
  updateEBPFCollectionEnabled: (ruleName: string, enabled: boolean) => void;
}

export function getRule(s: CollectorRulesState, ruleName: string): CollectorRule | undefined {
  return s.data.find((rule) => rule.rule.name === ruleName);
}
export function useCollectorRulesView() {
  const { rules, isFetching, error: fetchError, mutate, mutateDelete } = useFetchCollectorRules();

  const [currentState, setCurrentState] = useState<CollectorRulesState>({
    data: rules ?? [],
  } as CollectorRulesState);

  useEffect(() => {
    if (rules) {
      setCurrentState({
        data: [...rules],
      });
    }
  }, [rules]);

  return {
    isFetching,
    fetchError,
    data: { ...currentState },
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

        try {
          const res = await mutate({
            name: rule.rule.name,
            ebpf: rule.rule.ebpf,
            java: rule.rule.java,
            services: rule.rule.services,
          } as UpsertCollectionRuleRequest);

          setCurrentState({
            ...currentState,
            data: currentState.data.map((r) =>
              r.rule.name === ruleName
                ? {
                    ...rule,
                    rule: {
                      ...rule.rule,
                      lastUpdated: res.lastUpdated,
                      configuration: res.configuration,
                      generation: res.generation,
                    },
                    modified: false,
                  }
                : r
            ),
          });

          displaySuccess(['Rule successfully saved!']);
        } catch (error) {
          displayError(error as Error, [
            'Error while saving the collecor rule!',
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
      updateServiceEnabled(ruleName: string, serviceName: string, enabled: boolean) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }
        const service = rule.rule.services.find((service) => service.name === serviceName);
        if (!service) {
          rule.rule.services.push({ name: serviceName, enabled } as ServiceData);
        } else {
          service.enabled = enabled;
        }
        rule.modified = true;
        setCurrentState({
          ...currentState,
          data: currentState.data.map((r) => (r.rule.name === ruleName ? rule : r)),
        });
      },
      removeService(ruleName: string, serviceName: string) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }
        rule.rule.services = rule.rule.services.filter((service) => service.name !== serviceName);
        rule.modified = true;
        setCurrentState({
          ...currentState,
          data: currentState.data.map((r) => (r.rule.name === ruleName ? rule : r)),
        });
      },
      updateEBPFCollectionEnabled(ruleName: string, enabled: boolean) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }
        rule.rule.ebpf = { ...(rule.rule.ebpf || ({} as EBPFSettings)), enabled: enabled };
        rule.modified = true;
        setCurrentState({
          ...currentState,
          data: currentState.data.map((r) => (r.rule.name === ruleName ? rule : r)),
        });
      },
      updateJavaCollectionEnabled(ruleName: string, enabled: boolean) {
        const rule = this.getRule(ruleName);
        if (!rule) {
          return;
        }
        rule.rule.java = { ...(rule.rule.java || ({} as JavaSettings)), enabled: enabled };
        rule.modified = true;
        setCurrentState({
          ...currentState,
          data: currentState.data.map((r) => (r.rule.name === ruleName ? rule : r)),
        });
      },
    } as CollectorRulesActions,
  } as CollectorRulesController;
}
