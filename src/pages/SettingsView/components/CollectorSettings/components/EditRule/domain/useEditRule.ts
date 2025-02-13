import {
  EBPFSettings,
  JavaSettings,
  ServiceData,
  UpsertCollectionRuleRequest,
} from '@shared/pyroscope-api/settings/v1/setting_pb';
import { DomainHookReturnValueTyped as DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { debounce } from 'lodash';
import { useMemo, useState } from 'react';

import { EditRuleProps } from '../EditRule';

const validateRuleName = (name: string): boolean => /^[a-z0-9\-]+$/.test(name);

const RULE_NAME_DESCRIPTION = 'Must only contain lowercase letters, digits or hyphens.';
const RULE_NAME_ERROR_MESSAGE = 'Please enter a valid rule name. ' + RULE_NAME_DESCRIPTION;

function filterServices(services: ServiceData[], filter: string): ServiceData[] {
  return services.filter((service) => {
    return service.name?.toLowerCase().includes(filter?.toLocaleLowerCase());
  });
}

function newRule(): UpsertCollectionRuleRequest {
  return {
    name: '',
    java: { enabled: true },
    ebpf: { enabled: true },
    services: [] as ServiceData[],
  } as UpsertCollectionRuleRequest;
}

function cloneOrNewRule(existing?: UpsertCollectionRuleRequest): UpsertCollectionRuleRequest {
  if (existing === undefined) {
    return newRule();
  }

  return {
    ...existing,
    services: [...existing.services],
  } as UpsertCollectionRuleRequest;
}

export function useEditRule({
  existingRule,
  existingRuleNames,
  isModified,
  setIsModified,
  saveRule,
  onSubmit,
}: EditRuleProps): DomainHookReturnValue<
  {
    filteredServices: ServiceData[];
    serviceNames: string[];
    isModified: boolean;
    isNewRule: boolean;
    nameErrors: string[];
    nameDescription: string;
    rule: UpsertCollectionRuleRequest;
  },
  {
    updateName(event: React.ChangeEvent<HTMLInputElement>): void;
    updateFilter(event: React.ChangeEvent<HTMLInputElement>): void;
    updateEbpfEnabled(event: React.ChangeEvent<HTMLInputElement>): void;
    updateJavaEnabled(event: React.ChangeEvent<HTMLInputElement>): void;
    addService(name: string, enabled: boolean): void;
    removeService(name: string): void;
    handleReset(): void;
    handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
  }
> {
  const [nameErrors, setNameErrors] = useState<string[]>([]);

  const [rule, setRule] = useState<UpsertCollectionRuleRequest>(cloneOrNewRule(existingRule));

  const [filter, setFilter] = useState<string>('');

  const filteredServices = useMemo(() => filterServices(rule.services, filter), [filter, rule]);

  const serviceNames = useMemo(() => rule.services.map((rule) => rule.name), [rule]);

  const isNewRule = existingRule === undefined;

  return {
    data: {
      filteredServices,
      serviceNames,
      isModified: isModified ?? false,
      isNewRule,
      nameErrors,
      nameDescription: RULE_NAME_DESCRIPTION,
      rule,
    },
    actions: {
      updateName: debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        setIsModified?.(true);
        const newName = event.target.value;
        setRule({
          ...rule,
          name: newName,
        });

        // check if name matches spec
        const newNameErrors = [];
        if (!validateRuleName(newName)) {
          newNameErrors.push(RULE_NAME_ERROR_MESSAGE);
        }

        // check if name is not existing
        if (existingRuleNames && existingRuleNames.includes(newName)) {
          newNameErrors.push('Rule name already exists.');
        }
        setNameErrors(newNameErrors);
      }, 250),
      updateFilter: debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        const newFilter = event.target.value;
        setFilter(newFilter);
      }, 250),
      updateEbpfEnabled(event: React.ChangeEvent<HTMLInputElement>) {
        setIsModified?.(true);
        setRule({
          ...rule,
          ebpf: {
            ...rule.ebpf,
            enabled: event.currentTarget.checked,
          } as EBPFSettings,
        });
      },
      updateJavaEnabled(event: React.ChangeEvent<HTMLInputElement>) {
        setIsModified?.(true);
        setRule({
          ...rule,
          java: {
            ...rule.java,
            enabled: event.currentTarget.checked,
          } as JavaSettings,
        });
      },
      addService(name: string, enabled: boolean) {
        const newService = { name, enabled } as ServiceData;
        const serviceIdx = rule.services.findIndex((service) => service.name === name);
        if (serviceIdx === -1) {
          rule.services.push(newService);
        } else {
          rule.services[serviceIdx] = newService;
        }
        setIsModified?.(true);
        setRule({
          ...rule,
        });
      },
      removeService(name: string) {
        setIsModified?.(true);
        setRule({
          ...rule,
          services: rule.services.filter((service) => service.name !== name),
        });
      },
      handleReset() {
        setRule(cloneOrNewRule(existingRule));
        setIsModified?.(false);
      },
      handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // validate before fire
        if (nameErrors.length > 0) {
          return;
        }

        saveRule(rule);
        setIsModified?.(false);
        onSubmit?.();
      },
    },
  };
}
