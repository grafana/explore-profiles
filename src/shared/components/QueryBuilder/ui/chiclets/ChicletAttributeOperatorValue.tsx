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

export const ChicletAttributeOperatorValue = ({ filter, onClick, onRemove }: ChicletAttributeOperatorValueProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator, value, active } = filter;
  const className = active ? styles.chiclet : cx(styles.chiclet, styles.inactiveChiclet);

  return (
    <div className={className} aria-label="Filter">
      <Tag
        aria-label="Filter label"
        title="Cannot edit label"
        className={styles.chicletAttribute}
        name={attribute.label}
        onClick={noOp}
      />

      <Tag
        aria-label="Filter operator"
        title="Edit operator"
        name={operator.label}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
        tabIndex={0}
      />

      <Tag
        aria-label="Filter value"
        title="Edit value"
        name={value.label}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.value)}
        tabIndex={0}
      />

      <Tag
        aria-label="Remove filter"
        title="Remove filter"
        className={styles.chicletRemoveButton}
        icon="times"
        name=""
        onClick={(name, e) => onRemove(e, filter)}
        tabIndex={0}
      />
    </div>
  );
};
