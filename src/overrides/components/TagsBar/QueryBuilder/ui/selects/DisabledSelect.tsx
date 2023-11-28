import React from 'react';
import { Select, useStyles2 } from '@grafana/ui';
import { getStyles } from './SingleSelect';

const noOp = () => {};

export function DisabledSelect() {
  const styles = useStyles2(getStyles);

  return <Select disabled className={styles.select} placeholder="Add a filter..." onChange={noOp} />;
}
