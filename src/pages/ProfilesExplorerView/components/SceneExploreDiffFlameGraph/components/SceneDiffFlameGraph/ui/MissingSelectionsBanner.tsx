import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, Collapse, useStyles2 } from '@grafana/ui';
import DiffViewHowToImg from '@img/diff-view-how-to.gif';
import { InlineBanner } from '@shared/ui/InlineBanner';
import React, { useState } from 'react';

type MissingSelectionsBannerProps = {
  onClickAutoSelect: () => void;
  onOpenLearnHow: () => void;
};

export function MissingSelectionsBanner({ onClickAutoSelect, onOpenLearnHow }: MissingSelectionsBannerProps) {
  const styles = useStyles2(getStyles);

  const [isCollapseOpen, setIsCollapseOpen] = useState(false);

  const onToggleCollapse = () => {
    if (!isCollapseOpen) {
      onOpenLearnHow();
    }
    setIsCollapseOpen(!isCollapseOpen);
  };

  return (
    <InlineBanner
      severity="info"
      title={t(
        'diff-flame-graph.missing-selections.title',
        'Select both the baseline and the comparison flame graph ranges to view the diff flame graph'
      )}
      message={
        <div className={styles.infoMsg}>
          <Button variant="primary" onClick={onClickAutoSelect}>
            <Trans i18nKey="diff-flame-graph.missing-selections.auto-select">Auto-select</Trans>
          </Button>

          <Collapse
            label={t(
              'diff-flame-graph.missing-selections.learn-how',
              'Click here to learn how to select the flame graph ranges with the mouse'
            )}
            collapsible
            className={styles.collapse}
            isOpen={isCollapseOpen}
            onToggle={onToggleCollapse}
          >
            <div className={styles.collapseContent}>
              <ol>
                <li>
                  <Trans i18nKey="diff-flame-graph.missing-selections.step-1">
                    Ensure that the &ldquo;Flame graph&rdquo; range selection mode is selected
                  </Trans>
                </li>
                <li>
                  <Trans i18nKey="diff-flame-graph.missing-selections.step-2">
                    Use your mouse to select the desired time ranges on both the baseline and the comparison time series
                  </Trans>
                </li>
              </ol>
              <img
                src={DiffViewHowToImg}
                alt={t('diff-flame-graph.missing-selections.how-to-alt', 'How to view the diff flame graph')}
              />
            </div>
          </Collapse>
        </div>
      }
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  infoMsg: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing(1)};
    padding-top: ${theme.spacing(2)};
  `,
  collapse: css`
    background: transparent;
    border: 0;
  `,
  collapseContent: css`
    padding: 0 ${theme.spacing(5)};

    & img {
      max-width: 100%;
      width: auto;
      margin-top: ${theme.spacing(2)};
    }
  `,
});
