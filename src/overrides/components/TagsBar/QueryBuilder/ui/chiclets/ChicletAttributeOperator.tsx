import React from 'react';
import { Tag, useStyles2 } from '@grafana/ui';
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
  const className = active ? styles.chicletStyle : styles.inactiveChicletStyle;

  return (
    <div className={className}>
      <Tag className={styles.chicletAttributeStyle} name={attribute.label} title="Cannot edit label" onClick={noOp} />

      <Tag
        name={operator.label}
        title="Edit operator"
        onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
        tabIndex={0}
      />

      <Tag
        className={styles.chicletRemoveButtonStyle}
        icon="times"
        name=""
        title="Remove filter"
        onClick={(name, e) => onRemove(e, filter)}
        tabIndex={0}
      />
    </div>
  );
};
