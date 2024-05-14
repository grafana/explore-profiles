import { css } from '@emotion/css';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { Panel } from '@shared/components/Panel';
import { SidePanel } from '@shared/domain/useToggleSidePanel';
import React, { ReactNode } from 'react';

export const getStyles = () => ({
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
          showExplainFlameGraphButton && !sidePanel.isOpen('ai') ? (
            <AIButton
              text="Explain Flame Graph"
              interactionName="g_pyroscope_app_explain_flamegraph_clicked"
              onClick={() => sidePanel.open('ai')}
              disabled={isLoading}
            />
          ) : null
        }
      >
        {children}
      </Panel>

      {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}
    </div>
  );
}
