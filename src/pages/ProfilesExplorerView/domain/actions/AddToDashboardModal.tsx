import { t } from '@grafana/i18n';
import { usePluginComponent } from '@grafana/runtime';
import { Modal } from '@grafana/ui';
import React, { createElement } from 'react';

import {
  ADD_TO_DASHBOARD_COMPONENT_ID,
  type AddToDashboardFormProps,
  type PanelDataRequestPayload,
} from './addToDashboard';

interface AddToDashboardModalProps {
  panelData: PanelDataRequestPayload;
  onClose: () => void;
}

/** Loads the Grafana core form only while the modal is open (avoids usePluginComponent on every scene render). */
export function AddToDashboardModal({ panelData, onClose }: AddToDashboardModalProps) {
  const { component: AddToDashboardComponent, isLoading } =
    usePluginComponent<AddToDashboardFormProps>(ADD_TO_DASHBOARD_COMPONENT_ID);

  if (isLoading || !AddToDashboardComponent) {
    return null;
  }

  return (
    <Modal title={t('explorer.add-to-dashboard.modal-title', 'Add to dashboard')} isOpen onDismiss={onClose}>
      {createElement(AddToDashboardComponent as React.ComponentType<AddToDashboardFormProps>, {
        onClose,
        buildPanel: () => panelData.panel,
        timeRange: panelData.range,
        options: { useAbsolutePath: true },
      })}
    </Modal>
  );
}
