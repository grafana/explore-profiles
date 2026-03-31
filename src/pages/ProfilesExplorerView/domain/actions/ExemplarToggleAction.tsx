import { t, Trans } from '@grafana/i18n';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneLabelValuesTimeseries } from '../../components/SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';

interface ExemplarToggleActionState extends SceneObjectState {
  showExemplars: boolean;
}

export class ExemplarToggleAction extends SceneObjectBase<ExemplarToggleActionState> {
  constructor(showExemplars: boolean) {
    super({ showExemplars });
  }

  public onClick = () => {
    this.setState({ showExemplars: !this.state.showExemplars });
    const timeseries = sceneGraph.getAncestor(this, SceneLabelValuesTimeseries);
    timeseries.handleExemplarToggleChange(this.state.showExemplars);
  };

  public static Component = ({ model }: SceneComponentProps<ExemplarToggleAction>) => {
    const { showExemplars } = model.useState();

    return (
      <Button
        icon={showExemplars ? 'eye' : 'eye-slash'}
        variant="secondary"
        size="sm"
        aria-label={
          showExemplars
            ? t('actions.exemplar-toggle.hide', 'Hide exemplars')
            : t('actions.exemplar-toggle.show', 'Show exemplars')
        }
        tooltip={
          showExemplars
            ? t('actions.exemplar-toggle.hide', 'Hide exemplars')
            : t('actions.exemplar-toggle.show', 'Show exemplars')
        }
        tooltipPlacement="top"
        onClick={model.onClick}
      >
        <Trans i18nKey="actions.exemplar-toggle.label">Exemplars</Trans>
      </Button>
    );
  };
}
