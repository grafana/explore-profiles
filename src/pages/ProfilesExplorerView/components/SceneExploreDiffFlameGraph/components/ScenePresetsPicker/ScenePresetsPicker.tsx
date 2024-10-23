import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Modal, Select, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { FEEDBACK_FORM_URL } from '../../../GiveFeedbackButton';
import { CompareTarget } from '../../../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneComparePanel } from '../SceneComparePanel/SceneComparePanel';

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
  isModalOpen: boolean;
  value?: string;
}

export type Preset = {
  from: string;
  to: string;
  flameGraphFrom: string;
  flameGraphTo: string;
  label: string;
};

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
            label: '1h ago',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
            label: 'now',
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
            label: '6h ago',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
            label: 'now',
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
            label: '24h ago',
          },
          comparison: {
            from: 'now-1h',
            to: 'now',
            flameGraphFrom: 'now-30m',
            flameGraphTo: 'now',
            label: 'now',
          },
        },
      ],
    },
    {
      label: 'Custom presets',
      value: 'custom',
      options: [
        {
          label: 'Example',
          value: 'example',
        },
      ],
    },
  ];

  constructor() {
    super({
      name: 'compare-presets',
      label: 'Comparison presets',
      isModalOpen: false,
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
              this.setState({ value: undefined });
            }
          })
      );
    });
  }

  onChangePreset = (option: SelectableValue<string>) => {
    reportInteraction('g_pyroscope_app_diff_preset_changed', { value: option.value as string });

    if (option.value === 'example') {
      this.setState({ value: undefined, isModalOpen: true });
      return;
    }

    [CompareTarget.BASELINE, CompareTarget.COMPARISON].forEach((compareTarget) => {
      sceneGraph.findByKeyAndType(this, `${compareTarget}-panel`, SceneComparePanel).applyPreset(option[compareTarget]);
    });

    this.setState({ value: option.value });
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
    const { value, isModalOpen } = model.useState();

    return (
      <>
        <div className={styles.presetsContainer}>
          <Select
            // we set this key to be able to clear the preset w
            key={String(!value && Math.random())}
            placeholder="Choose a preset"
            value={value}
            options={ScenePresetsPicker.PRESETS}
            onChange={model.onChangePreset}
          />
          <Button
            icon="save"
            variant="secondary"
            tooltip="Save the current time ranges and filters as a custom preset"
            onClick={model.onClickSave}
          />
        </div>
        <Modal
          title="Custom presets"
          isOpen={isModalOpen}
          closeOnEscape={true}
          closeOnBackdropClick={true}
          onDismiss={model.closeModal}
        >
          <p>
            This feature, which would allow you to save the current time ranges and filters, is currently not
            implemented.
          </p>
          <p>
            Please let us know if you would be interested to use it by{' '}
            <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer noopener" className={styles.link}>
              leaving us your feedback.
            </a>
          </p>
          <p>Thank you!</p>
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
