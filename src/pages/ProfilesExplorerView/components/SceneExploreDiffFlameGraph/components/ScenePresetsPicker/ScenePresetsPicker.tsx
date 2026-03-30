import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { Button, Modal, Select, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { FEEDBACK_FORM_URL } from '../../../GiveFeedbackButton';
import { EventDiffAutoSelect } from '../../domain/events/EventDiffAutoSelect';
import { CompareTarget } from '../../domain/types';
import { SceneComparePanel } from '../SceneComparePanel/SceneComparePanel';

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
  isModalOpen: boolean;
  isSelectOpen: boolean;
  value: string | null;
}

export type Preset = {
  from: string;
  to: string;
  diffFrom: string;
  diffTo: string;
  label: string;
};

export class ScenePresetsPicker extends SceneObjectBase<ScenePresetsPickerState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['dataSource', 'serviceName'],
    onReferencedVariableValueChanged: () => {
      this.reset();
    },
  });

  static getPresets() {
    return [
      {
        label: t('diff-flame-graph.presets.built-in', 'Built-in presets'),
        value: 'built-in',
        options: [
          {
            value: 'last hour (30m-window)',
            label: t('diff-flame-graph.presets.last-hour-30m', 'Last hour (30m-window)'),
            baseline: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-1h',
              diffTo: 'now-30m',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
            comparison: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-30m',
              diffTo: 'now',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
          },
          {
            value: 'last hour (1h-window)',
            label: t('diff-flame-graph.presets.last-hour-1h', 'Last hour (1h-window)'),
            baseline: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-1h',
              diffTo: 'now',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
            comparison: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-1h',
              diffTo: 'now',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
          },
          {
            value: '6h ago vs now',
            label: t('diff-flame-graph.presets.6h-ago-vs-now', '6h ago vs now (30m-window)'),
            baseline: {
              from: 'now-375m',
              to: 'now-315m',
              diffFrom: 'now-375m',
              diffTo: 'now-345m',
              label: t('diff-flame-graph.presets.6h-ago', '6h ago'),
            },
            comparison: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-30m',
              diffTo: 'now',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
          },
          {
            value: '24h ago vs now',
            label: t('diff-flame-graph.presets.24h-ago-vs-now', '24h ago vs now (30m-window)'),
            baseline: {
              from: 'now-1455m',
              to: 'now-1395m',
              diffFrom: 'now-1455m',
              diffTo: 'now-1425m',
              label: t('diff-flame-graph.presets.24h-ago', '24h ago'),
            },
            comparison: {
              from: 'now-1h',
              to: 'now',
              diffFrom: 'now-30m',
              diffTo: 'now',
              label: t('diff-flame-graph.presets.last-hour', 'last hour'),
            },
          },
          {
            value: 'auto-select-25',
            label: t('diff-flame-graph.presets.auto-select-25', 'Auto-select (25% range)'),
          },
          {
            value: 'auto-select-whole',
            label: t('diff-flame-graph.presets.auto-select-whole', 'Auto-select (whole range)'),
          },
        ],
      },
      {
        label: t('diff-flame-graph.presets.my-presets', 'My presets'),
        value: 'custom',
        options: [
          {
            label: t('diff-flame-graph.presets.dummy', 'Dummy preset saved earlier'),
            value: 'dummy',
          },
        ],
      },
    ];
  }

  constructor() {
    super({
      name: 'compare-presets',
      label: t('diff-flame-graph.presets.label', 'Comparison presets'),
      value: null,
      isModalOpen: false,
      isSelectOpen: false,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    [CompareTarget.BASELINE, CompareTarget.COMPARISON].forEach((compareTarget) => {
      this._subs.add(
        sceneGraph
          .findByKeyAndType(this, `${compareTarget}-panel`, SceneComparePanel)
          .state.$timeRange.subscribeToState((newState, prevState) => {
            if (newState.from !== prevState.from || newState.to !== prevState.to) {
              this.setState({ value: null });
            }
          })
      );
    });
  }

  onChangePreset = (option: SelectableValue<string>) => {
    reportInteraction('g_pyroscope_app_diff_preset_selected', { value: option.value as string });

    this.closeSelect();

    if (option.value === 'dummy') {
      this.setState({ value: null, isModalOpen: true });
      return;
    }

    if (option.value?.startsWith('auto-select-')) {
      this.setState({ value: null });

      this.publishEvent(new EventDiffAutoSelect({ wholeRange: option.value === 'auto-select-whole' }), true);
      return;
    }

    [CompareTarget.BASELINE, CompareTarget.COMPARISON].forEach((compareTarget) => {
      const panel = sceneGraph.findByKeyAndType(this, `${compareTarget}-panel`, SceneComparePanel);

      panel.toggleTimeRangeSync(false);
      panel.applyPreset(option[compareTarget]);
    });

    this.setState({ value: option.value });
  };

  onClickSave = () => {
    reportInteraction('g_pyroscope_app_diff_preset_save_clicked');

    this.setState({ isModalOpen: true });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  openSelect() {
    this.setState({ isSelectOpen: true });
  }

  closeSelect() {
    this.setState({ isSelectOpen: false });
  }

  onOpenSelect = () => {
    setTimeout(() => this.openSelect(), 0);
  };

  onCloseSelect = () => {
    this.closeSelect();
  };

  reset() {
    this.setState({ value: null, isSelectOpen: false, isModalOpen: false });
  }

  static Component({ model }: SceneComponentProps<ScenePresetsPicker & { onChange: any }>) {
    const styles = useStyles2(getStyles);
    const { value, isSelectOpen, isModalOpen } = model.useState();

    return (
      <>
        <div className={styles.presetsContainer}>
          <Select
            className={styles.select}
            placeholder={t('diff-flame-graph.presets.placeholder', 'Choose a preset')}
            value={value}
            options={ScenePresetsPicker.getPresets()}
            onChange={model.onChangePreset}
            isOpen={isSelectOpen}
            onOpenMenu={model.onOpenSelect}
            onCloseMenu={model.onCloseSelect}
          />

          <Button
            icon="save"
            variant="secondary"
            tooltip={t(
              'diff-flame-graph.presets.save-tooltip',
              'Save the current time ranges and filters as a custom preset'
            )}
            onClick={model.onClickSave}
          />
        </div>
        <Modal
          title={t('diff-flame-graph.presets.modal-title', 'Custom user presets')}
          isOpen={isModalOpen}
          closeOnEscape={true}
          closeOnBackdropClick={true}
          onDismiss={model.closeModal}
        >
          <p>
            <Trans i18nKey="diff-flame-graph.presets.modal-not-implemented">
              This feature, which would allow you to save the current time ranges and filters, is currently not
              implemented.
            </Trans>
          </p>
          <p>
            <Trans i18nKey="diff-flame-graph.presets.modal-feedback">
              Please let us know if you would be interested to use it by{' '}
              <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer noopener" className={styles.link}>
                leaving us your feedback.
              </a>
            </Trans>
          </p>
          <p>
            <Trans i18nKey="diff-flame-graph.presets.modal-thank-you">Thank you!</Trans>
          </p>
          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={model.closeModal}>
              <Trans i18nKey="diff-flame-graph.presets.cancel">Cancel</Trans>
            </Button>
            <Button onClick={model.closeModal} disabled>
              <Trans i18nKey="diff-flame-graph.presets.save">Save</Trans>
            </Button>
          </Modal.ButtonRow>
        </Modal>
      </>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  presetsContainer: css`
    display: flex;
  `,
  select: css`
    min-width: ${theme.spacing(24)};
    text-align: left;
  `,
  link: css`
    color: ${theme.colors.text.link};
  `,
});
