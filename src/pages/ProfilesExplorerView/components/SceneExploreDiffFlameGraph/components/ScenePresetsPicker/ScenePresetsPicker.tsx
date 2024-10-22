import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Modal, Select, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { FEEDBACK_FORM_URL } from '../../../GiveFeedbackButton';
import { SceneComparePanel } from '../SceneComparePanel/SceneComparePanel';

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
  isModalOpen: boolean;
}

export class ScenePresetsPicker extends SceneObjectBase<ScenePresetsPickerState> {
  static PRESETS = [
    {
      label: 'Built-in presets',
      value: 'built-in',
      options: [
        {
          value: '1h ago vs now',
          label: '1h ago vs now',
          baseline: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-1h',
            flameGraphTo: 'now-30m',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
          },
        },
        {
          value: '6h ago vs now',
          label: '6h ago vs now',
          baseline: {
            from: 'now-6h',
            to: 'now-5h',
            flameGraphFrom: 'now-360m',
            flameGraphTo: 'now-330m',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
          },
        },
        {
          value: '24h ago vs now',
          label: '24h ago vs now',
          baseline: {
            from: 'now-24h',
            to: 'now-23h',
            flameGraphFrom: 'now-1440m',
            flameGraphTo: 'now-1410m',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
          },
        },
      ],
    },
    {
      label: 'User presets',
      value: 'user-in',
      options: [],
    },
  ];

  constructor() {
    super({
      name: 'presets',
      label: 'Comparison presets',
      isModalOpen: false,
    });
  }

  onChangePreset = (preset: SelectableValue<string>) => {
    reportInteraction('g_pyroscope_app_diff_preset_changed', { value: preset.value as string });

    const { baseline, comparison } = preset;

    const [baseLinePanel, comparisonPanel] = ['baseline-panel', 'comparison-panel'].map((key) =>
      sceneGraph.findByKeyAndType(this, key, SceneComparePanel)
    );

    baseLinePanel.setTimeRange(baseline.from, baseline.to);
    baseLinePanel.setAnnotationTimeRange(baseline.flameGraphFrom, baseline.flameGraphTo);

    comparisonPanel.setTimeRange(comparison.from, comparison.to);
    comparisonPanel.setAnnotationTimeRange(comparison.flameGraphFrom, comparison.flameGraphTo);
  };

  onClickSave = () => {
    reportInteraction('g_pyroscope_app_diff_preset_save');

    this.setState({ isModalOpen: true });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  static Component({ model }: SceneComponentProps<ScenePresetsPicker & { onChange: any }>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { isModalOpen } = model.useState();

    return (
      <>
        <div className={styles.presetsContainer}>
          <Select placeholder="Choose a preset" options={ScenePresetsPicker.PRESETS} onChange={model.onChangePreset} />
          <Button
            icon="save"
            variant="secondary"
            tooltip="Save the current time ranges and filters as a custom preset"
            onClick={model.onClickSave}
          />
        </div>
        <Modal
          title="Save user preset"
          isOpen={isModalOpen}
          closeOnEscape={true}
          closeOnBackdropClick={true}
          onDismiss={model.closeModal}
        >
          <div>This feature is currently not implemented.</div>
          <div>
            Please let us know if you would be interested to use it by{' '}
            <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer noopener" className={styles.link}>
              leaving us your feedback.
            </a>
          </div>
          <div>Thank you!</div>
          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={model.closeModal}>
              Cancel
            </Button>
            <Button onClick={model.closeModal} disabled>
              Save
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
  link: css`
    color: ${theme.colors.text.link};
  `,
});
