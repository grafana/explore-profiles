import React from 'react';
import { cx } from '@emotion/css';
import { Tag, useStyles2 } from '@grafana/ui';
import { CompleteFilter, FilterPartKind } from '../../domain/types';
import { getStyles } from './Chiclet';

type ChicletAttributeOperatorValueProps = {
  filter: CompleteFilter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter, part: FilterPartKind) => void;
  onRemove: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter) => void;
};

const noOp = () => {};

export const ChicletAttributeOperatorValue = ({ filter, onClick, onRemove }: ChicletAttributeOperatorValueProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator, value, active } = filter;
  const className = active ? styles.chiclet : cx(styles.chiclet, styles.inactiveChiclet);

  return (
    <div className={className}>
      <Tag className={styles.chicletAttribute} name={attribute.label} title="Cannot edit label" onClick={noOp} />

      <Tag
        name={operator.label}
        title="Edit operator"
        onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
        tabIndex={0}
      />

      <Tag
        name={value.label}
        title="Edit value"
        onClick={(name, e) => onClick(e, filter, FilterPartKind.value)}
        tabIndex={0}
      />

      <Tag
        className={styles.chicletRemoveButton}
        icon="times"
        name=""
        title="Remove filter"
        onClick={(name, e) => onRemove(e, filter)}
        tabIndex={0}
      />
    </div>
  );
};
