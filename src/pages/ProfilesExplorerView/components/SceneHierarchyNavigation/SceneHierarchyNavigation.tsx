import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon, Tag, useStyles2 } from '@grafana/ui';
import { useGroupByLabels } from '@shared/infrastructure/settings/GroupByLabelsContext';
import React from 'react';

interface SceneHierarchyNavigationState extends SceneObjectState {
  currentLevel: number;
  selections: Record<string, string>;
}

export class SceneHierarchyNavigation extends SceneObjectBase<SceneHierarchyNavigationState> {
  constructor() {
    super({
      key: 'hierarchy-navigation',
      currentLevel: 0,
      selections: {},
    });
  }

  setSelection(label: string, value: string, level: number) {
    const { selections } = this.state;
    const newSelections = { ...selections, [label]: value };

    // Clear selections for levels below the current one
    // This is handled by the variable subscriptions

    this.setState({
      selections: newSelections,
      currentLevel: level + 1,
    });
  }

  goToLevel(level: number) {
    this.setState({ currentLevel: level });
  }

  static Component({ model }: SceneComponentProps<SceneHierarchyNavigation>) {
    return <HierarchyNavigationContent model={model} />;
  }
}

function HierarchyNavigationContent({ model }: { model: SceneHierarchyNavigation }) {
  const styles = useStyles2(getStyles);
  const { groupByLabels, isUsingHierarchy } = useGroupByLabels();
  const { selections, currentLevel } = model.useState();

  // Don't show hierarchy navigation for default service_name only config
  if (!isUsingHierarchy) {
    return null;
  }

  const breadcrumbs = groupByLabels.slice(0, currentLevel).map((label, idx) => ({
    label,
    value: selections[label] || '',
    level: idx,
  }));

  const currentLabel = groupByLabels[currentLevel];

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbs}>
        {breadcrumbs.map(({ label, value, level }) => (
          <React.Fragment key={label}>
            <Tag
              name={`${label}: ${value}`}
              className={styles.breadcrumb}
              onClick={() => model.goToLevel(level)}
            />
            <Icon name="angle-right" className={styles.separator} />
          </React.Fragment>
        ))}
        {currentLabel && <span className={styles.currentLevel}>{currentLabel}</span>}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)} 0;
  `,
  breadcrumbs: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
  `,
  breadcrumb: css`
    cursor: pointer;
    &:hover {
      background-color: ${theme.colors.action.hover};
    }
  `,
  separator: css`
    color: ${theme.colors.text.secondary};
  `,
  currentLevel: css`
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});
