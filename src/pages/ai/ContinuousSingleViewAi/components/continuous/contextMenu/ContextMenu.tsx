/* eslint-disable react/jsx-props-no-spreading */
import { ContextMenuProps as PluginContextMenuProps } from '@pyroscope/components/TimelineChart/ContextMenu.plugin';
import { ControlledMenu, useMenuState } from '@pyroscope/ui/Menu';
import React, { useEffect } from 'react';

interface ContextMenuProps {
  /** position */
  position: PluginContextMenuProps['click'];

  /** must be not empty */
  children: React.ReactNode;
}

function ContextMenu(props: ContextMenuProps) {
  const { position, children } = props;
  const [menuProps, toggleMenu] = useMenuState({ transition: true });

  // https://github.com/szhsin/react-menu/issues/2#issuecomment-719166062
  useEffect(() => {
    toggleMenu(true);
  }, [toggleMenu]);

  return (
    <>
      <ControlledMenu
        {...menuProps}
        anchorPoint={{ x: position.pageX, y: position.pageY }}
        onClose={() => toggleMenu(false)}
      >
        {children}
      </ControlledMenu>
    </>
  );
}

export default ContextMenu;
