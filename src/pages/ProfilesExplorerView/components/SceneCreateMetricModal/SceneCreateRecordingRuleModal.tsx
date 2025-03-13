import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Divider, Field, Input, Modal, MultiSelect, useStyles2 } from '@grafana/ui';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { RecordingRule } from '@shared/infrastructure/recording-rules/RecordingRule';
import React, { useEffect, useState } from 'react';
import { Controller, FieldError, SubmitHandler, useForm } from 'react-hook-form';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';

interface RecordingRuleForm {
  metricName: string;
  labels: Array<SelectableValue<string>>;
  serviceName: string;
  profileType: string;
  matcher: string;
}

interface SceneCreateRecordingRuleModalState extends SceneObjectState {}

export class SceneCreateRecordingRuleModal extends SceneObjectBase<SceneCreateRecordingRuleModalState> {
  constructor() {
    super({
      key: 'create-recording-rule-modal',
    });
  }

  static Component = ({
    model,
    isModalOpen,
    onDismiss,
    onCreate,
  }: SceneComponentProps<SceneCreateRecordingRuleModal> & {
    isModalOpen: boolean;
    onDismiss: () => void;
    onCreate: (rule: RecordingRule) => Promise<void>;
  }) => {
    const styles = useStyles2(getStyles);

    const {
      register,
      reset,
      handleSubmit,
      control,
      formState: { errors },
    } = useForm<RecordingRuleForm>();

    const closeModal = () => {
      reset();
      onDismiss();
    };

    const onSubmit: SubmitHandler<RecordingRuleForm> = (data) =>
      onCreate({
        version: 1,
        name: data.metricName,
        serviceName: data.serviceName,
        profileType: data.profileType,
        matcher: data.matcher,
        labels: data.labels ? data.labels.map((label) => label.value ?? '') : [],
      });

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
      <Modal title="Create recording rule" isOpen={isModalOpen} onDismiss={closeModal}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Field
            label="Metric name"
            description="The name of the Prometheus metric"
            error={MetricNameErrorComponent(errors.metricName)}
            invalid={!!errors.metricName}
          >
            <Input
              placeholder={`pyroscope_metric_${profileMetric.type}_${serviceName
                .toString()
                .replace(/[^a-zA-Z0-9_]/g, '_')}`}
              required
              autoFocus
              {...register('metricName', {
                required: 'Metric name is required.',
                // This pattern was pulled from here: https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
                pattern: {
                  value: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                  message: 'Invalid metric name.',
                },
              })}
            />
          </Field>

          <Field label="Additional labels" description="Additional profiling labels to forward to the metric">
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
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                />
              )}
            />
          </Field>

          <Divider />

          <Field label="Service name">
            <div className={styles.readonlyValue}>{`${serviceName}`}</div>
          </Field>
          <input type="text" value={serviceName.toString()} hidden {...register('serviceName')} />

          <Field label="Profile type">
            <div className={styles.readonlyValue}>{`${profileMetric.group}/${profileMetric.type}`}</div>
          </Field>
          <input type="text" value={profileMetric.id} hidden {...register('profileType')} />

          <Field label="Filters" description="Filters selected in the main view will be applied to this rule">
            <div className={styles.readonlyValue}>{filters.length === 0 ? 'No filters selected' : filterQuery}</div>
          </Field>

          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={closeModal}>
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

const MetricNameErrorComponent = (error: FieldError | undefined) => {
  const styles = useStyles2(getStyles);

  if (error === undefined || error.message === undefined) {
    return undefined;
  }

  if (error.type === 'pattern') {
    return (
      <div>
        <span>Metric name is invalid, it must have the following properties:</span>
        <ul className={styles.errorList}>
          <li>Only contain alphanumeric characters or underscores</li>
          <li>Must not begin with a number</li>
        </ul>
      </div>
    );
  }

  return <div>{error.message}</div>;
};

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  readonlyRow: css`
    align-items: center;
    max-width: 100%;
  `,

  readonlyValue: css`
    max-width: 100%;
  `,

  errorList: css`
    padding-left: ${theme.spacing(2)};
  `,
});
