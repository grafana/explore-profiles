import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  link: css`
    color: ${theme.colors.text.link};
    &:hover {
      text-decoration: underline;
    }
  `,
});

export function StyledLink({ href, children }: { href: string; children: React.ReactNode }) {
  const styles = useStyles2(getStyles);

  return (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer">
      {children} {<Icon name="external-link-alt" />}
    </a>
  );
}
