import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@shared/pyroscope-api/settings/v1/setting_pb';
import { DomainHookReturnValueTyped as DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { ViewRuleProps } from '../ViewRule';

export function useViewRule({ rule }: ViewRuleProps): DomainHookReturnValue<
  {
    isModified: boolean;
    showConfig: boolean;
    showDeploy: boolean;
    rule: GetCollectionRuleResponse;
    existingRule: UpsertCollectionRuleRequest;
  },
  {
    onConfigDone(): void;
    toggleShowConfig(): void;
    toggleShowDeploy(): void;
    setIsModified(isModified: boolean): void;
  }
> {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showDeploy, setShowDeploy] = useState<boolean>(false);
  const [isModified, setIsModified] = useState<boolean>(false);
  return {
    data: {
      isModified,
      showConfig,
      showDeploy,
      rule,
      existingRule: {
        name: rule.name,
        services: rule.services,
        java: rule.java,
        ebpf: rule.ebpf,
        // TODO: ObservedLastUpdated
      } as UpsertCollectionRuleRequest,
    },
    actions: {
      onConfigDone() {
        setShowConfig(false);
        setShowDeploy(true);
      },
      toggleShowConfig() {
        setShowConfig(!showConfig);
      },
      toggleShowDeploy() {
        setShowDeploy(!showDeploy);
      },
      setIsModified,
    },
  };
}
