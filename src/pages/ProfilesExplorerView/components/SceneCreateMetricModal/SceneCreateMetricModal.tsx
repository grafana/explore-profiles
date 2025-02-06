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
import { Metric } from '@shared/infrastructure/metrics/Metric';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';

interface MetricForm {
  metricName: string;
  labels: Array<SelectableValue<string>>;
  serviceName: string;
  profileType: string;
  prometheusDataSource: string;
  matcher: string;
}

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
    const styles = useStyles2(getStyles);

    const {
      register,
      handleSubmit,
      control,
      formState: { errors },
    } = useForm<MetricForm>();
    const onSubmit: SubmitHandler<MetricForm> = (data) =>
      onCreate({
        version: 1,
        name: data.metricName,
        serviceName: data.serviceName,
        profileType: data.profileType,
        matcher: data.matcher,
        labels: data.labels.map((label) => label.value ?? ''),
        prometheusDataSource: data.prometheusDataSource,
      });

    const labelWidth = 20;
    const fieldWidth = 65;

    // TODO(bryan) replace this with real data sources.
    const dataSourceName = 'dummy-data-source';
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <>
            <InlineFieldRow>
              <InlineField
                htmlFor="metricName"
                label="Metric name"
                labelWidth={labelWidth}
                invalid={!!errors.metricName}
                error={errors.metricName?.message}
              >
                <Input
                  width={fieldWidth}
                  placeholder="Metric name"
                  required
                  autoFocus
                  {...register('metricName', {
                    required: 'Metric name is required.',
                    // This pattern was pulled from here: https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
                    pattern: {
                      value: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                      message: 'Invalid metric name, must be a valid Prometheus metric name.',
                    },
                  })}
                />
              </InlineField>
            </InlineFieldRow>

            <InlineFieldRow>
              <InlineField
                htmlFor="labels"
                label="Included labels"
                labelWidth={labelWidth}
                invalid={!!errors.labels}
                error={errors.labels?.message}
              >
                <Controller
                  name="labels"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      {...field}
                      options={options.map((opt) => ({ label: opt, value: opt }))}
                      toggleAllOptions={{
                        enabled: true,
                      }}
                      width={fieldWidth}
                    />
                  )}
                />
              </InlineField>
            </InlineFieldRow>

            <Divider />

            <InlineFieldRow>
              <InlineField className={styles.readonlyRow} label="Service name" labelWidth={labelWidth} disabled>
                <div className={styles.readonlyText}>
                  <Text>{`${serviceName}`}</Text>
                </div>
              </InlineField>
            </InlineFieldRow>
            <input type="text" value={serviceName.toString()} hidden {...register('serviceName')} />

            <InlineFieldRow>
              <InlineField className={styles.readonlyRow} label="Profile type" labelWidth={labelWidth} disabled>
                <div className={styles.readonlyText}>{`${profileMetric.group}/${profileMetric.type}`}</div>
              </InlineField>
            </InlineFieldRow>
            <input type="text" value={profileMetric.id} hidden {...register('profileType')} />

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
            <input type="text" value={dataSourceName} hidden {...register('prometheusDataSource')} />
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
