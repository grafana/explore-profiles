import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Icon, InlineField, InlineFieldRow, Input, Modal, MultiSelect, useStyles2 } from '@grafana/ui';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useEffect, useState } from 'react';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';

interface SceneCreateMetricModalState extends SceneObjectState {}

export class SceneCreateMetricModal extends SceneObjectBase<SceneCreateMetricModalState> {
  constructor() {
    super({
      key: 'create-metric-modal',
    });
  }

  static Component = ({
    model,
    isModalOpen,
    onDismiss,
    onCreate,
  }: SceneComponentProps<SceneCreateMetricModal> & {
    isModalOpen: () => boolean;
    onDismiss: () => void;
    onCreate: () => void;
  }) => {
    // eslint-disable-next-line no-unused-vars
    const styles = useStyles2(getStyles);
    const labelWidth = 20;
    const fieldWidth = 65;

    // TODO(bryan) replace this with real data sources.
    const dataSourceName = 'ops-cortex';
    const dataSourceUid = 'ops-cortex-uid';

    const [values, setValues] = useState<Array<SelectableValue<string>>>([]);
    const [options, setOptions] = useState<string[]>([]);

    const profileMetricVariable = sceneGraph.findByKeyAndType(model, 'profileMetricId', ProfileMetricVariable);
    const profileMetric = getProfileMetric(profileMetricVariable.state.value as ProfileMetricId);

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
    const filterQuery = filters.map((filter) => `${filter.key}${filter.operator}"${filter.value}"`).join(', ');

    useEffect(() => {
      const timeRange = sceneGraph.getTimeRange(model).state.value;
      labelsRepository
        .listLabels({
          query: `{${filterQuery}}`,
          from: timeRange.from.unix() * 1000,
          to: timeRange.to.unix() * 1000,
        })
        .then((suggestions) => {
          setOptions(suggestions.map((s) => s.value));
        });
    }, [filterQuery, model]);

    return (
      <Modal title="Create metric" isOpen={isModalOpen()} onDismiss={onDismiss}>
        <form>
          <>
            <InlineFieldRow>
              <InlineField label="Metric name" labelWidth={labelWidth}>
                <Input width={fieldWidth} placeholder="Name" required />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Profile type" labelWidth={labelWidth}>
                <Input width={fieldWidth} value={`${profileMetric.group}/${profileMetric.type}`} required readOnly />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Filter" labelWidth={labelWidth}>
                <Input width={fieldWidth} value={`{${filterQuery}}`} required readOnly />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField label="Data source" labelWidth={labelWidth}>
                <Input
                  width={fieldWidth}
                  value={dataSourceName}
                  prefix={<Icon name={'gf-prometheus'} />}
                  required
                  readOnly
                  disabled
                />
              </InlineField>
            </InlineFieldRow>
            <input value={dataSourceUid} required readOnly hidden />

            <InlineFieldRow>
              <InlineField label="Included labels" labelWidth={labelWidth}>
                <MultiSelect
                  options={options.map((opt) => ({ label: opt, value: opt }))}
                  value={values}
                  onChange={setValues}
                  toggleAllOptions={{
                    enabled: true,
                  }}
                  width={fieldWidth}
                />
              </InlineField>
            </InlineFieldRow>
          </>
        </form>

        <Modal.ButtonRow>
          <Button variant="secondary" fill="outline" onClick={onDismiss}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create</Button>
        </Modal.ButtonRow>
      </Modal>
    );
  };
}

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({});
