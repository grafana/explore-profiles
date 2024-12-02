import { PanelMenuItem, PluginExtensionLink } from '@grafana/data';
import { SceneObjectBase, SceneObjectState, VizPanel, VizPanelMenu } from '@grafana/scenes';
import { ScaleDistribution, ScaleDistributionConfig } from '@grafana/schema';
import { merge } from 'lodash';

interface TimeSeriesPanelMenuScalesState extends SceneObjectState {
  onClickExplore: () => void;
  onScaleChanged: (scaleType: ScaleDistribution) => void;
}

export class TimeSeriesPanelMenuScales extends SceneObjectBase<TimeSeriesPanelMenuScalesState> {
  private selectedScale: ScaleDistribution;
  private menu?: VizPanelMenu;
  private panel?: VizPanel;
  private explorationsLink: PluginExtensionLink | undefined;

  constructor(state: TimeSeriesPanelMenuScalesState) {
    super(state);
    this.selectedScale = ScaleDistribution.Linear;
    this.addActivationHandler(() => this._onActivate());
  }

  _onActivate() {
    if (this.parent instanceof VizPanelMenu && this.parent?.parent instanceof VizPanel) {
      this.menu = this.parent;
      this.panel = this.parent.parent;
      this._refreshItems();
    } else {
      throw new Error('Incorrectly attached');
    }
  }

  _onClickScaleOption(option: PanelMenuItem & { scaleDistribution: ScaleDistributionConfig }) {
    if (!this.panel || !this.menu) {
      return;
    }

    const { scaleDistribution, text } = option;

    this.selectedScale = scaleDistribution.type;

    this.panel.clearFieldConfigCache();

    this.panel.setState({
      fieldConfig: merge({}, this.panel.state.fieldConfig, {
        defaults: {
          custom: {
            scaleDistribution,
            axisLabel: scaleDistribution.type !== ScaleDistribution.Linear ? text : '',
          },
        },
      }),
    });

    this.state.onScaleChanged(this.selectedScale);
  }

  _refreshItems() {
    if (!this.panel || !this.menu) {
      return;
    }

    const items: PanelMenuItem[] = [
      {
        text: 'Scale type',
        type: 'group',
        subMenu: [
          {
            text: 'Linear',
            scaleDistribution: { type: ScaleDistribution.Linear },
          },
          {
            text: 'Log2',
            scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
          },
        ].map((option) => ({
          text: `${this.selectedScale === option.scaleDistribution.type ? '✔ ' : ''}${option.text}`,
          onClick: () => this._onClickScaleOption(option),
        })),
      },
      {
        type: 'divider',
        text: '',
      },
      {
        iconClassName: 'compass',
        text: 'Open in Explore',
        onClick: () => this.state.onClickExplore(),
      },
    ];

    if (this.explorationsLink) {
      items.push({
        iconClassName: 'plus-square',
        text: 'Add to investigation',
        onClick: () => {
          this.explorationsLink?.onClick?.();
        },
      });
    }

    this.menu.setItems(items);
  }

  setExplorationsLink(link: PluginExtensionLink | undefined) {
    this.explorationsLink = link;
    this._refreshItems();
  }
}
