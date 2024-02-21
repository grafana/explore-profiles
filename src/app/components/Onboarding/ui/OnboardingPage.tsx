import { css } from '@emotion/css';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { OnboardingModal } from './OnboardingModal';

type OnboardingPageProps = {
  onCloseModal: () => void;
};

/** This was extracted from the former `styles.module.scss` */
// TODO Use more spacial and color parameters from `theme`
const getStyles = (theme: GrafanaTheme2) => ({
  onboardingPage: css`
    padding: 16px;
    margin: 64px;
    position: relative;
    background-color: ${theme.colors.background.primary};
  `,
  closeButton: css`
    position: absolute;
    top: -30px;
    opacity: 0.8;
    right: -32px;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    line-height: 40px;
    display: block;
    padding: 0;
    margin: 0;
    font-size: 22px;
  `,
});

const pageNav = { text: 'Onboarding' };

export function OnboardingPage({ onCloseModal }: OnboardingPageProps) {
  const styles = useStyles2(getStyles);

  return (
    // The use of `PluginPage` is to set a clear "Onboarding" breadcrumb
    // Using `Custom` ensures that it takes up the whole page (and doesn't conflict with the other `PluginPage`)
    <PluginPage pageNav={pageNav} layout={PageLayoutType.Custom}>
      <div className={styles.onboardingPage}>
        <button
          className={styles.closeButton}
          onClick={onCloseModal}
          title="Close"
          data-testid="close-onboarding-modal"
        >
          &times;
        </button>
        <OnboardingModal />
      </div>
    </PluginPage>
  );
}
