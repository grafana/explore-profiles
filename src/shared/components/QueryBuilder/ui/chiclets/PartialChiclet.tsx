import { cx } from '@emotion/css';
import { t } from '@grafana/i18n';
import { Tag, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FilterPartKind, PartialFilter } from '../../domain/types';
import { getStyles } from './Chiclet';

type PartialChicletProps = {
  filter: PartialFilter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: PartialFilter, part: FilterPartKind) => void;
};

export const PartialChiclet = ({ filter, onClick }: PartialChicletProps) => {
  const styles = useStyles2(getStyles);

  const { attribute, operator } = filter;
  if (!attribute && !operator) {
    return null;
  }

  return (
    <div
      className={cx(styles.chiclet, styles.partialChiclet)}
      aria-label={t('query-builder.chiclet.partial-filter', 'Partial filter')}
    >
      <Tag
        colorIndex={9}
        name={attribute.label}
        title={t('query-builder.chiclet.edit-attribute', 'Edit "{{label}}"', { label: attribute.label })}
        onClick={(name, e) => onClick(e, filter, FilterPartKind.attribute)}
        tabIndex={0}
      />

      {operator && (
        <Tag
          colorIndex={9}
          name={operator.label}
          title={t('query-builder.chiclet.edit-operator', 'Edit "{{label}}"', { label: operator.label })}
          className={styles.chicletOperator}
          onClick={(name, e) => onClick(e, filter, FilterPartKind.operator)}
          tabIndex={0}
        />
      )}
    </div>
  );
};
