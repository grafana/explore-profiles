import { css, cx } from '@emotion/css';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

import { TitleItem } from './TitleItem';

interface Props {
  description: string | (() => string);
  className?: string;
}

export function PanelDescription({ description, className }: Props) {
  const styles = useStyles2(getStyles);

  const getDescriptionContent = () => {
    const panelDescription = typeof description === 'function' ? description() : description;

    return (
      <div className="panel-info-content markdown-html">
        <div dangerouslySetInnerHTML={{ __html: panelDescription }} />
      </div>
    );
  };

  return description !== '' ? (
    <Tooltip interactive content={getDescriptionContent}>
      <TitleItem className={cx(className, styles.description)}>
        <Icon name="info-circle" size="md" />
      </TitleItem>
    </Tooltip>
  ) : null;
}

const getStyles = () => {
  return {
    description: css({
      code: {
        whiteSpace: 'normal',
        wordWrap: 'break-word',
      },

      'pre > code': {
        display: 'block',
      },
    }),
  };
};
