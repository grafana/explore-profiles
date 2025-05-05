import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Modal, Spinner, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  loadingIcon: css`
    color: ${theme.colors.primary.main};
    font-size: 48px;
    margin-bottom: ${theme.spacing(2)};
    display: flex;
    justify-content: center;
  `,
  loadingMessage: css`
    text-align: center;
    font-size: ${theme.typography.h4.fontSize};
    margin-bottom: ${theme.spacing(2)};
  `,
  fullScreenModal: css`
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
  `,
});

export default function GitHubCallbackView() {
  const styles = useStyles2(getStyles);
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleDismiss = () => {
    setIsModalOpen(false);
    window.close();
  };

  return (
    <Modal
      title="GitHub Login"
      isOpen={isModalOpen}
      onDismiss={handleDismiss}
      closeOnEscape={true}
      closeOnBackdropClick={true}
      className={styles.fullScreenModal}
    >
      <div className={styles.loadingMessage}>
        <div className={styles.loadingIcon}>
          <Spinner size="xl" />
        </div>
        <p>Logging in to GitHub...</p>
      </div>
    </Modal>
  );
}
