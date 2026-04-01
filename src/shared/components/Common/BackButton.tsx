import { t, Trans } from '@grafana/i18n';
import { Button } from '@grafana/ui';
import React from 'react';

export function BackButton({ onClick }: { onClick?: () => void }) {
  const callback = onClick ? onClick : () => history.back();
  return (
    <Button
      variant="secondary"
      onClick={callback}
      aria-label={t('back-button.aria-label', 'Back to Profiles Drilldown')}
    >
      <Trans i18nKey="back-button.label">Back to Profiles Drilldown</Trans>
    </Button>
  );
}
