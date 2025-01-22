import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, InlineField, InlineFieldRow, Input, Modal, Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';

interface SceneCreateMetricModalState extends SceneObjectState {}

export class SceneCreateMetricModal extends SceneObjectBase<SceneCreateMetricModalState> {
  constructor() {
    super({ key: 'create-metric-modal' });
  }

  static Component = ({
    model,
    isModalOpen,
    onDismiss,
    onSave,
  }: SceneComponentProps<SceneCreateMetricModal> & {
    isModalOpen: () => boolean;
    onDismiss: () => void;
    onSave: () => void;
  }) => {
    // eslint-disable-next-line no-unused-vars
    const styles = useStyles2(getStyles);
    const labelWidth = 20;
    const fieldWidth = 65;

    const profileMetricVariable = sceneGraph.findByKeyAndType(model, 'profileMetricId', ProfileMetricVariable);

    const serviceNameVariable = sceneGraph.findByKeyAndType(model, 'serviceName', ServiceNameVariable);
    const filtersVariable = sceneGraph.findByKeyAndType(model, 'filters', FiltersVariable);
    const filters = [
      {
        key: 'service_name',
        operator: '=',
        value: serviceNameVariable.state.value,
      },
      ...filtersVariable.state.filters,
    ];
    const filterQuery = filters.map((filter) => `${filter.key} ${filter.operator} "${filter.value}"`).join(', ');

    return (
      <Modal title="Create metric" isOpen={isModalOpen()} onDismiss={onDismiss}>
        <form>
          <>
            <InlineFieldRow>
              <InlineField label="Name" labelWidth={labelWidth}>
                <Input width={fieldWidth} placeholder="Name" required />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Profile type" labelWidth={labelWidth}>
                <Input width={fieldWidth} value={profileMetricVariable.state.value.toString()} required />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Included labels" labelWidth={labelWidth}>
                <Select
                  width={fieldWidth}
                  options={[
                    { label: 'service_name', value: 'service_name' },
                    { label: 'vehicle', value: 'vehicle' },
                  ]}
                  value={[
                    { label: 'service_name', value: 'service_name' },
                    { label: 'vehicle', value: 'vehicle' },
                  ]}
                  onChange={() => {}}
                  isMulti
                />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Filter" labelWidth={labelWidth}>
                <Input width={fieldWidth} value={`{${filterQuery}}`} required />
              </InlineField>
            </InlineFieldRow>
          </>
        </form>

        <Modal.ButtonRow>
          <Button variant="secondary" fill="outline" onClick={onDismiss}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Modal.ButtonRow>
      </Modal>
    );
  };
}

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({});
