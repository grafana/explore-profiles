import { cx } from '@emotion/css';
import { selectors } from '@grafana/e2e-selectors';
import { Dropdown, ToolbarButton } from '@grafana/ui';
import React, { ReactElement, useCallback } from 'react';

type TooltipPlacement =
  | 'auto-start'
  | 'auto'
  | 'auto-end'
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-end'
  | 'bottom'
  | 'bottom-start'
  | 'left-end'
  | 'left'
  | 'left-start';

interface PanelMenuProps {
  menu: ReactElement | (() => ReactElement);
  menuButtonClass?: string;
  dragClassCancel?: string;
  title?: string;
  placement?: TooltipPlacement;
  offset?: [number, number];
  onVisibleChange?: (state: boolean) => void;
  onOpenMenu?: () => void;
}

export function PanelMenu({
  menu,
  title,
  placement = 'bottom',
  offset,
  dragClassCancel,
  menuButtonClass,
  onVisibleChange,
  onOpenMenu,
}: PanelMenuProps) {
  const testId = title ? selectors.components.Panels.Panel.menu(title) : `panel-menu-button`;

  const handleVisibility = useCallback(
    (show: boolean) => {
      if (show && onOpenMenu) {
        onOpenMenu();
      }
      return onVisibleChange;
    },
    [onOpenMenu, onVisibleChange]
  );

  const label = title ? `Menu for panel with title ${title}` : `Menu for panel with no title`;

  return (
    <Dropdown overlay={menu} placement={placement} offset={offset} onVisibleChange={handleVisibility}>
      <ToolbarButton
        aria-label={label}
        title="Menu"
        icon="ellipsis-v"
        iconSize="md"
        narrow
        data-testid={testId}
        className={cx(menuButtonClass, dragClassCancel)}
      />
    </Dropdown>
  );
}
