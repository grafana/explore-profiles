import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { DomainHookReturnValueTyped as DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { ViewRuleProps } from '../ViewRule';

export function useViewRule({ rule }: ViewRuleProps): DomainHookReturnValue<
  {
    modified: boolean;
    showConfig: boolean;
    showDeploy: boolean;
    rule: GetCollectionRuleResponse;
    existingRule: UpsertCollectionRuleRequest;
  },
  {
    onSubmit(): void;
    onDismiss(): void;
    onDeploy(): void;
    onModify(): void;
    toggleShowConfig(): void;
    toggleShowDeploy(): void;
  }
> {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showDeploy, setShowDeploy] = useState<boolean>(false);
  const [modified, setModified] = useState<boolean>(false);
  return {
    data: {
      modified,
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
      onSubmit() {},
      onDismiss() {},
      onDeploy() {},
      onModify() {
        setModified(true);
      },
      toggleShowConfig() {
        setShowConfig(!showConfig);
      },
      toggleShowDeploy() {
        setShowDeploy(!showDeploy);
      },
    },
  };
}
