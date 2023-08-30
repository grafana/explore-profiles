import React, { useState } from 'react';
import { useAppSelector } from '@pyroscope/redux/hooks';
import { selectAppNamesState } from '@pyroscope/redux/reducers/continuous';
import { Button, Modal, Icon } from '@grafana/ui';

/**
 * Displays an onboarding dialog instructing how to push data
 * only when data is not present
 *
 * It assumes apps are loaded via a different component
 */
export function OnboardingDialog() {
  const appNamesState = useAppSelector(selectAppNamesState);

  if (appNamesState.type === 'loaded' && appNamesState.data.length <= 0) {
    return <Dialog />;
  }

  return null;
}

function Dialog() {
  const [isDialogOpen, setDialogOpen] = useState(true);

  return (
    <Modal title={'Onboarding'} isOpen={isDialogOpen} onDismiss={() => setDialogOpen(false)}>
      <div>{"It looks like you haven't ingested any data yet."}</div>
      <div>
        <a href="https://grafana.com/docs/phlare/latest/configure-client/" target="_blank" rel="noreferrer">
          To get started with sending data add one of the profiling clients to your application.{' '}
          <Icon name="external-link-alt" />
        </a>
      </div>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={() => setDialogOpen(false)}>
          Cancel
        </Button>
        <Button>
          <a href="https://grafana.com/docs/phlare/latest/configure-client/" target="_blank" rel="noreferrer">
            See docs <Icon name="external-link-alt" />
          </a>
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
