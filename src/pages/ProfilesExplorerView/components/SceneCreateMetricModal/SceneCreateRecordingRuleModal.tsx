import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Divider, Field, Input, Modal, MultiSelect, Text, useStyles2 } from '@grafana/ui';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { RecordingRuleViewModel } from '@shared/types/RecordingRuleViewModel';
import React, { useEffect, useState } from 'react';
import { Controller, FieldError, SubmitHandler, useForm } from 'react-hook-form';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { ExplorationType, SceneProfilesExplorer } from '../SceneProfilesExplorer/SceneProfilesExplorer';
import { useCreateRecordingRule } from './domain/useCreateRecordingRule';

const METRIC_NAME_PREFIX = 'pyroscope_exported_metrics_';

interface RecordingRuleForm {
  metricName: string;
  labels: Array<SelectableValue<string>>;
  serviceName: string;
  profileType: string;
  matcher: string;
  functionName?: string;
}

interface SceneCreateRecordingRuleModalState extends SceneObjectState {}

/**
 * Returns the service name if a service name dropdown is visible on the screen for the user.
 *
 * In "All services" and "Favorites" exploration types, the service name is not shown on the screen,
 * though the variable is still present in the URL so we need to check explicitly what's the current
 * exploration type instead of just reading the variable name.
 */
function useCurrentServiceName(model: SceneCreateRecordingRuleModal) {
  const serviceNameVariable = sceneGraph.findByKeyAndType(model, 'serviceName', ServiceNameVariable);
  const serviceName = serviceNameVariable.state.value;

  const explorationType = sceneGraph
    .findByKeyAndType(model, 'profiles-explorer', SceneProfilesExplorer)
    .useState().explorationType;
  return explorationType === ExplorationType.ALL_SERVICES || explorationType === ExplorationType.FAVORITES
    ? undefined
    : serviceName;
}

export class SceneCreateRecordingRuleModal extends SceneObjectBase<SceneCreateRecordingRuleModalState> {
  constructor() {
    super({});
  }

  static Component = ({
    model,
    isModalOpen,
    onDismiss,
    onCreated,
    functionName,
  }: SceneComponentProps<SceneCreateRecordingRuleModal> & {
    isModalOpen: boolean;
    onDismiss: () => void;
    onCreated: () => void;
    functionName?: string;
  }) => {
    const [options, setOptions] = useState<string[]>([]);

    const { actions } = useCreateRecordingRule();

    const profileMetricVariable = sceneGraph.findByKeyAndType(model, 'profileMetricId', ProfileMetricVariable);
    const profileMetric = getProfileMetric(profileMetricVariable.state.value as ProfileMetricId);

    const serviceName = useCurrentServiceName(model);

    const filtersVariable = sceneGraph.findByKeyAndType(model, 'filters', FiltersVariable);
    const filters = filtersVariable.state.filters;
    const filterQuery = filters.map((filter) => `${filter.key}${filter.operator}"${filter.value}"`).join(', ');

    const {
      register,
      handleSubmit,
      control,
      formState: { errors },
    } = useForm<RecordingRuleForm>({
      mode: 'onChange',
      shouldUnregister: true,
      values: {
        functionName,
        metricName: '',
        labels: [],
        serviceName: serviceName?.toString() || '',
        matcher: '',
        profileType: profileMetric.id,
      },
    });

    const onSubmit: SubmitHandler<RecordingRuleForm> = async (data) => {
      const rule: RecordingRuleViewModel = {
        id: '',
        metricName: METRIC_NAME_PREFIX + data.metricName,
        serviceName: data.serviceName,
        profileType: data.profileType,
        matchers: [`{${filterQuery}}`],
        groupBy: data.labels ? data.labels.map((label) => label.value ?? '') : [],
        functionName: data.functionName,
        readonly: false,
      };
      await actions.save(rule);
      onCreated();
    };

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
      <Modal
        title="Create recording rule"
        isOpen={isModalOpen}
        onDismiss={onDismiss}
        data-testid="Create recording rule modal"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Field
            label="Metric name"
            description={`The name of the Prometheus metric. The name will be automatically prefixed with '${METRIC_NAME_PREFIX}'.`}
            error={MetricNameErrorComponent(errors.metricName)}
            invalid={!!errors.metricName}
          >
            <div className={css({ display: 'flex' })}>
              <div className={css({ alignContent: 'center', fontFamily: 'monospace' })}>{METRIC_NAME_PREFIX}</div>
              <Input
                className={css({ input: { fontFamily: 'monospace', paddingLeft: 0 } })}
                placeholder={`${profileMetric.type}_${(serviceName || 'name')
                  .toString()
                  .replace(/[^a-zA-Z0-9_]/g, '_')}`}
                aria-label="Metric name"
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
            </div>
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

          <Field label="Service name" data-testid="Create recording rule modal service name field">
            {serviceName ? (
              <div>{`${serviceName}`}</div>
            ) : (
              <Text element="span" color="secondary">
                All services
              </Text>
            )}
          </Field>

          <input type="text" hidden {...register('serviceName')} />

          <Field label="Profile type">
            <div>{`${profileMetric.group}/${profileMetric.type}`}</div>
          </Field>
          <input type="text" hidden {...register('profileType')} />

          <Field label="Function name" description="Optional function name to filter the recording rule">
            <Input
              aria-label="Function name"
              placeholder="Leave empty for total aggregation"
              {...register('functionName')}
            />
          </Field>

          <Field label="Filters" description="Filters selected in the main view will be applied to this rule">
            <div>{filters.length === 0 ? 'No filters selected' : filterQuery}</div>
          </Field>

          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={onDismiss} aria-label="Cancel">
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
      <span>
        <span>Metric name is invalid, it must have the following properties:</span>
        <ul className={styles.errorList}>
          <li>Only contain alphanumeric characters or underscores</li>
          <li>Must not begin with a number</li>
        </ul>
      </span>
    );
  }

  return <span>{error.message}</span>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorList: css`
    padding-left: ${theme.spacing(2)};
  `,
});
