import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import React from 'react';
import { PartialFilter, FilterPartKind } from '../../domain/types';
import { chicletStyle } from './Chiclet';

type PartialChicletProps = {
  filter: PartialFilter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: PartialFilter, part: FilterPartKind) => void;
};

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  partialChicletStyle: css`
    ${chicletStyle};
    & > button {
      background-color: #6e6e6e;
    }
    & :nth-child(2) {
      padding: 6px;
    }
  `,
});

export const PartialChiclet = ({ filter, onClick }: PartialChicletProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator } = filter;
  if (!attribute && !operator) {
    return null;
  }

  return (
    <div className={styles.partialChicletStyle}>
      <Tag
        colorIndex={9}
        name={attribute.label}
        title={`Edit "${attribute.label}"`}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.attribute)}
        tabIndex={0}
      />

      {operator && (
        <Tag
          colorIndex={9}
          name={operator.label}
          title={`Edit "${operator.label}"`}
          onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
          tabIndex={0}
        />
      )}
    </div>
  );
};
