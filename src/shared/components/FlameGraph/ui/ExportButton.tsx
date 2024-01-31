import { Button, Tooltip } from '@grafana/ui';
import React from 'react';

type ExportButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function ExportButton({ onClick }: ExportButtonProps) {
  return (
    <Tooltip content="Export data">
      <Button
        icon={'download-alt'}
        size={'sm'}
        variant={'secondary'}
        fill={'outline'}
        onClick={onClick}
        aria-label="Export data"
      />
    </Tooltip>
  );
}
