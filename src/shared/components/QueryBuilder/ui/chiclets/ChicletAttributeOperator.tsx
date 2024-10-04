import { cx } from '@emotion/css';
import { Tag, useStyles2 } from '@grafana/ui';
import React from 'react';

import { CompleteFilter, FilterPartKind } from '../../domain/types';
import { getStyles } from './Chiclet';

type ChicletAttributeOperatorValueProps = {
  filter: CompleteFilter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter, part: FilterPartKind) => void;
  onRemove: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter) => void;
};

const noOp = () => {};

export const ChicletAttributeOperator = ({ filter, onClick, onRemove }: ChicletAttributeOperatorValueProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator, active } = filter;
  const className = active ? styles.chiclet : cx(styles.chiclet, styles.inactiveChiclet);

  return (
    <div className={className} aria-label="Filter">
      <Tag aria-label="Filter label" className={styles.chicletAttribute} name={attribute.label} onClick={noOp} />

      <Tag
        aria-label="Filter operator"
        className={styles.chicletOperator}
        name={operator.label}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
        tabIndex={0}
      />

      <Tag
        aria-label="Remove filter"
        className={styles.chicletRemoveButton}
        icon="times"
        name=""
        onClick={(name, e) => onRemove(e, filter)}
        tabIndex={0}
      />
    </div>
  );
};
