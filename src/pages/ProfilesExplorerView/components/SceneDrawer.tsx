import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import React from 'react';

interface SceneDrawerState extends SceneObjectState {
  key?: string;
  isOpen?: boolean;
  title?: string;
  subTitle?: string;
  body?: SceneObject;
}

export class SceneDrawer extends SceneObjectBase<SceneDrawerState> {
  constructor(state?: SceneDrawerState) {
    super({
      key: 'drawer',
      isOpen: false,
      ...state,
    });
  }

  open = ({
    title,
    subTitle,
    body,
  }: {
    title?: SceneDrawerState['title'];
    subTitle?: SceneDrawerState['subTitle'];
    body?: SceneDrawerState['body'];
  }) => {
    this.setState({ ...this.state, isOpen: true, title, subTitle, body });
  };

  close = () => {
    this.setState({ isOpen: false });
  };

  static Component = ({ model }: SceneComponentProps<SceneDrawer>) => {
    const { isOpen, title, subTitle, body } = model.useState();

    return (
      <>
        {body && isOpen && (
          <Drawer size="lg" title={title} subtitle={subTitle} closeOnMaskClick onClose={model.close}>
            <body.Component model={body} />
          </Drawer>
        )}
      </>
    );
  };
}
