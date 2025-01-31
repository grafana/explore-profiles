import {
  EBPFSettings,
  JavaSettings,
  ServiceData,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { debounce } from 'lodash';
import { useMemo, useState } from 'react';

import { EditRuleProps } from '../EditRule';

const validateRuleName = (name: string): boolean => /^[a-z0-9\-]+$/.test(name);

function filterServices(services: ServiceData[], filter: string): ServiceData[] {
  return services.filter((service) => {
    return service.name?.toLowerCase().includes(filter?.toLocaleLowerCase());
  });
}

export function useEditRule({ existingRule, saveRule }: EditRuleProps): DomainHookReturnValue {
  const [isModified, setIsModified] = useState(false);
  const [isNameInvalid, setIsNameInvalid] = useState(false);

  const [rule, setRule] = useState(existingRule || ({} as UpsertCollectionRuleRequest));

  const [filter, setFilter] = useState<string>('');

  const filteredServices = useMemo(() => filterServices(rule.services, filter), [filter, rule]);

  const isNewRule = existingRule === undefined;

  return {
    data: {
      filteredServices,
      isModified,
      isNewRule,
      isNameInvalid,
      rule,
    },
    actions: {
      updateName: debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        setIsModified(true);
        const newName = event.target.value;
        setRule({
          ...rule,
          name: newName,
        });
        setIsNameInvalid(!validateRuleName(newName));
      }, 250),
      updateEbpfEnabled: (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsModified(true);
        setRule({
          ...rule,
          ebpf: {
            ...rule.ebpf,
            enabled: event.currentTarget.checked,
          } as EBPFSettings,
        });
      },
      updateJavaEnabled: (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsModified(true);
        setRule({
          ...rule,
          java: {
            ...rule.java,
            enabled: event.currentTarget.checked,
          } as JavaSettings,
        });
      },
      addService: (name: string, enabled: boolean) => {
        const service = rule.services.find((service) => service.name === name);
        if (!service) {
          rule.services.push({ name: name, enabled } as ServiceData);
        } else {
          service.enabled = enabled;
        }
        setIsModified(true);
        setRule({
          ...rule,
        });
      },
      removeService: (name: string) => {
        setIsModified(true);
        setRule({
          ...rule,
          services: rule.services.filter((service) => service.name !== name),
        });
      },
    },
  };
}
