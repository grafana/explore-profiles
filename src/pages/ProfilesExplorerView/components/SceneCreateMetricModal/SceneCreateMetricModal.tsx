import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import {
  Button,
  Divider,
  Icon,
  InlineField,
  InlineFieldRow,
  Input,
  Modal,
  MultiSelect,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useEffect, useState } from 'react';

import { Metric } from '../../../../shared/infrastructure/metrics/Metric';
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
    onCreate: (metric: Metric) => Promise<void>;
  }) => {
    // eslint-disable-next-line no-unused-vars
    const styles = useStyles2(getStyles);
    const labelWidth = 20;
    const fieldWidth = 65;

    // TODO(bryan) replace this with real data sources.
    const dataSourceName = 'dummy-data-source';

    const [values, setValues] = useState<Array<SelectableValue<string>>>([]);
    const [options, setOptions] = useState<string[]>([]);

    const profileMetricVariable = sceneGraph.findByKeyAndType(model, 'profileMetricId', ProfileMetricVariable);
    const profileMetric = getProfileMetric(profileMetricVariable.state.value as ProfileMetricId);

    const serviceNameVariable = sceneGraph.findByKeyAndType(model, 'serviceName', ServiceNameVariable);
    const serviceName = serviceNameVariable.state.value;

    const filtersVariable = sceneGraph.findByKeyAndType(model, 'filters', FiltersVariable);
    const filters = filtersVariable.state.filters;
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
        <form
          onSubmit={(e) => {
            e.preventDefault();

            const nameInput = e.currentTarget.elements.namedItem('metric_name') as HTMLInputElement;
            const name = nameInput.value;

            const labels = values.map((v) => v?.value).filter((v) => v !== undefined && v !== null);

            onCreate({
              version: 1,
              name,
              serviceName: serviceName.toString(),
              profileType: profileMetric.id,
              matcher: filterQuery,
              prometheusDataSource: dataSourceName,
              labels,
            });
          }}
        >
          <>
            <InlineFieldRow>
              <InlineField className={styles.readonlyRow} label="Profile type" labelWidth={labelWidth} disabled>
                <div className={styles.readonlyText}>{`${profileMetric.group}/${profileMetric.type}`}</div>
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField className={styles.readonlyRow} label="Service name" labelWidth={labelWidth} disabled>
                <div className={styles.readonlyText}>
                  <Text>{`${serviceName}`}</Text>
                </div>
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField className={styles.readonlyRow} label="Data source" labelWidth={labelWidth} disabled>
                <div className={styles.readonlyText}>
                  <Stack direction="row" alignItems="center" justifyContent="flex-start">
                    {/* note(bryanhuhta): This color is taken from the Prometheus svg from grafana.com */}
                    <Icon name="gf-prometheus" color="#DA4E31" />
                    <span>{dataSourceName}</span>
                  </Stack>
                </div>
              </InlineField>
            </InlineFieldRow>

            <Divider />

            <InlineFieldRow>
              <InlineField htmlFor="metric_name" label="Metric name" labelWidth={labelWidth}>
                <Input id="metric_name" width={fieldWidth} placeholder="Name" required autoFocus />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField htmlFor="metric_labels" label="Included labels" labelWidth={labelWidth}>
                <MultiSelect
                  id="metric_labels"
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

          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </Modal.ButtonRow>
        </form>
      </Modal>
    );
  };
}

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  readonlyRow: css`
    align-items: center;
  `,

  readonlyText: css`
    padding-left: ${theme.spacing(1)};
  `,
});
