import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { Panel } from '@shared/components/Panel';
import { SidePanel } from '@shared/domain/useToggleSidePanel';
import React, { ReactNode } from 'react';

export const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
  `,
  flamegraphPanel: css`
    min-width: 0;
    flex-grow: 1;
  `,
  sidePanel: css`
    flex: 1 0 50%;
    margin-left: 8px;
    max-width: calc(50% - 4px);
  `,
  aiButton: css`
    margin-top: ${theme.spacing(1)};
  `,
});

type ComparisonDiffPanelProps = {
  isLoading: boolean;
  children: ReactNode;
  sidePanel: SidePanel;
  showExplainFlameGraphButton: boolean;
};

export function ComparisonDiffPanel({
  isLoading,
  children,
  sidePanel,
  showExplainFlameGraphButton,
}: ComparisonDiffPanelProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.flex}>
      <Panel
        dataTestId="diff-panel"
        className={styles.flamegraphPanel}
        isLoading={isLoading}
        title={isLoading ? <Spinner /> : null}
        headerActions={
          <AIButton
            className={styles.aiButton}
            onClick={() => sidePanel.open('ai')}
            disabled={isLoading || !showExplainFlameGraphButton || sidePanel.isOpen('ai')}
            interactionName="g_pyroscope_app_explain_flamegraph_clicked"
          >
            Explain Flame Graph
          </AIButton>
        }
      >
        {children}
      </Panel>

      {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}
    </div>
  );
}
