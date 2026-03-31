import { Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getMessages } from '../constants';
import { getStyles } from './SingleSelect';

const noOp = () => {};

export function DisabledSelect() {
  const styles = useStyles2(getStyles);

  return <Select disabled className={styles.select} placeholder={getMessages().FILTER_ADD} onChange={noOp} />;
}
