import { t, Trans } from '@grafana/i18n';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SpanProfilesToggled } from '../../components/SceneExploreServiceFlameGraph/domain/events/SpanProfilesToggled';

interface SpanExemplarToggleActionState extends SceneObjectState {
  showSpanExemplars: boolean;
  hasSpanData?: boolean;
}

export class SpanExemplarToggleAction extends SceneObjectBase<SpanExemplarToggleActionState> {
  constructor(showSpanExemplars: boolean) {
    super({ showSpanExemplars });
  }

  public onClick = () => {
    if (this.state.hasSpanData === false) {
      return;
    }

    const showSpanExemplars = !this.state.showSpanExemplars;
    this.setState({ showSpanExemplars });
    this.publishEvent(new SpanProfilesToggled({ enabled: showSpanExemplars }), true);
  };

  public static Component = ({ model }: SceneComponentProps<SpanExemplarToggleAction>) => {
    return <SpanExemplarToggleButton model={model} />;
  };
}

export function SpanExemplarToggleButton({ model }: { model: SpanExemplarToggleAction }) {
  const { showSpanExemplars, hasSpanData } = model.useState();
  const disabled = hasSpanData === false;

  return (
    <Button
      icon={showSpanExemplars ? 'eye' : 'eye-slash'}
      variant="secondary"
      size="sm"
      disabled={disabled}
      tooltip={
        disabled
          ? t(
              'actions.span-exemplar-toggle.unavailable',
              'No span profiles are available for the current service, filters, and time range'
            )
          : showSpanExemplars
          ? t('actions.span-exemplar-toggle.hide', 'Hide span profiles')
          : t('actions.span-exemplar-toggle.show', 'Show span profiles')
      }
      tooltipPlacement="top"
      onClick={model.onClick}
    >
      <Trans i18nKey="actions.span-exemplar-toggle.label">Span profiles</Trans>
    </Button>
  );
}
