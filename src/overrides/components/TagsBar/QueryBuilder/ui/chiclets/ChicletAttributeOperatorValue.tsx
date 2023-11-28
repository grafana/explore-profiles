import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { CompleteFilter, FilterPartKind } from '../../domain/types';
import { chicletStyle, noHoverStyle } from './Chiclet';

type ChicletAttributeOperatorValueProps = {
  filter: CompleteFilter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter, part: FilterPartKind) => void;
  onRemove: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter) => void;
};

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  chicletStyle,
  attribute: css`
    ${noHoverStyle};
    background-color: rgb(34, 37, 43);
  `,
  operator: css`
    background-color: rgb(34, 37, 43);
  `,
  value: css`
    background-color: rgb(34, 37, 43);
  `,
  removeButton: css`
    background-color: rgb(34, 37, 43);
    & svg {
      width: 12px;
      height: 12px;
    }
  `,
});

const noOp = () => {};

export const ChicletAttributeOperatorValue = ({ filter, onClick, onRemove }: ChicletAttributeOperatorValueProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator, value } = filter;

  return (
    <div className={styles.chicletStyle}>
      <Tag name={attribute.label} title="Cannot edit label" className={styles.attribute} onClick={noOp} />

      <Tag
        name={operator.label}
        title="Edit operator"
        className={styles.operator}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
        tabIndex={0}
      />

      <Tag
        name={value.label}
        title="Edit value"
        className={styles.value}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.value)}
        tabIndex={0}
      />

      <Tag
        colorIndex={7}
        icon="times"
        name=""
        title="Remove filter"
        className={styles.removeButton}
        onClick={(name, e) => onRemove(e, filter)}
        tabIndex={0}
      />
    </div>
  );
};
