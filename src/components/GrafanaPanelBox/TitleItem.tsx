import { cx, css, CSSObject } from '@emotion/css';
import React, { forwardRef } from 'react';

import { GrafanaTheme, GrafanaTheme2, LinkModel, LinkTarget } from '@grafana/data';

import { useStyles2, Button } from '@grafana/ui';
import tinycolor from 'tinycolor2';

type TitleItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: LinkModel['onClick'];
  href?: string;
  target?: LinkTarget;
  title?: string;
};

type TitleItemElement = HTMLAnchorElement & HTMLButtonElement;

export const TitleItem = forwardRef<TitleItemElement, TitleItemProps>(
  ({ className, children, href, onClick, target, title, ...rest }, ref) => {
    const styles = useStyles2(getStyles);

    if (href) {
      return (
        <a
          ref={ref}
          href={href}
          onClick={onClick}
          target={target}
          title={title}
          className={cx(styles.linkItem, className)}
          {...rest}
        >
          {children}
        </a>
      );
    } else if (onClick) {
      return (
        <Button ref={ref} className={cx(styles.item, className)} variant="secondary" fill="text" onClick={onClick}>
          {children}
        </Button>
      );
    } else {
      return (
        <span ref={ref} className={cx(styles.item, className)} {...rest}>
          {children}
        </span>
      );
    }
  }
);

TitleItem.displayName = 'TitleItem';

const getStyles = (theme: GrafanaTheme2) => {
  const item = css({
    color: `${theme.colors.text.secondary}`,
    label: 'panel-header-item',
    cursor: 'auto',
    border: 'none',
    borderRadius: `${theme.shape.borderRadius()}`,
    padding: `${theme.spacing(0, 1)}`,
    height: `${theme.spacing(theme.components.panel.headerHeight)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '&:focus, &:focus-visible': {
      ...getFocusStyles(theme),
      zIndex: 1,
    },
    '&: focus:not(:focus-visible)': getMouseFocusStyles(theme),

    '&:hover ': {
      boxShadow: `${theme.shadows.z1}`,
      background: `${theme.colors.background.secondary}`,
      color: `${theme.colors.text.primary}`,
    },
  });

  return {
    item,
    linkItem: cx(item, css({ cursor: 'pointer' })),
  };
};

export function cardChrome(theme: GrafanaTheme2): string {
  return `
    background: ${theme.colors.background.secondary};
    &:hover {
      background: ${hoverColor(theme.colors.background.secondary, theme)};
    }
    box-shadow: ${theme.components.panel.boxShadow};
    border-radius: ${theme.shape.radius.default};
`;
}

export function hoverColor(color: string, theme: GrafanaTheme2): string {
  return theme.isDark ? tinycolor(color).brighten(2).toString() : tinycolor(color).darken(2).toString();
}

export function listItem(theme: GrafanaTheme2): string {
  return `
  background: ${theme.colors.background.secondary};
  &:hover {
    background: ${hoverColor(theme.colors.background.secondary, theme)};
  }
  box-shadow: ${theme.components.panel.boxShadow};
  border-radius: ${theme.shape.radius.default};
`;
}

export function listItemSelected(theme: GrafanaTheme2): string {
  return `
    background: ${hoverColor(theme.colors.background.secondary, theme)};
    color: ${theme.colors.text.maxContrast};
`;
}

export function mediaUp(breakpoint: string) {
  return `only screen and (min-width: ${breakpoint})`;
}

const isGrafanaTheme2 = (theme: GrafanaTheme | GrafanaTheme2): theme is GrafanaTheme2 => theme.hasOwnProperty('v1');
export const focusCss = (theme: GrafanaTheme | GrafanaTheme2) => {
  const isTheme2 = isGrafanaTheme2(theme);
  const firstColor = isTheme2 ? theme.colors.background.canvas : theme.colors.bodyBg;
  const secondColor = isTheme2 ? theme.colors.primary.main : theme.colors.formFocusOutline;

  return `
  outline: 2px dotted transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px ${firstColor}, 0 0 0px 4px ${secondColor};
  transition-property: outline, outline-offset, box-shadow;
  transition-duration: 0.2s;
  transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);`;
};

export function getMouseFocusStyles(theme: GrafanaTheme | GrafanaTheme2): CSSObject {
  return {
    outline: 'none',
    boxShadow: `none`,
  };
}

export function getFocusStyles(theme: GrafanaTheme2): CSSObject {
  return {
    outline: '2px dotted transparent',
    outlineOffset: '2px',
    boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
    transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
    transitionDuration: '0.2s',
    transitionProperty: 'outline, outline-offset, box-shadow',
  };
}

// max-width is set up based on .grafana-tooltip class that's used in dashboard
export const getTooltipContainerStyles = (theme: GrafanaTheme2) => `
  overflow: hidden;
  background: ${theme.colors.background.secondary};
  box-shadow: ${theme.shadows.z2};
  max-width: 800px;
  padding: ${theme.spacing(1)};
  border-radius: ${theme.shape.radius.default};
  z-index: ${theme.zIndex.tooltip};
`;
