import { Mousetrap } from './Mousetrap';

export const mousetrap = new Mousetrap(document);

export interface KeyBindingItem {
  key: string;
  onTrigger: () => void;
  type?: string;
}

export class KeybindingSet {
  private _binds: KeyBindingItem[] = [];

  addBinding(item: KeyBindingItem) {
    mousetrap.bind(
      item.key,
      (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.returnValue = false;
        item.onTrigger();
      },
      'keydown'
    );
    this._binds.push({ ...item, type: 'keydown' });
  }

  removeAll() {
    this._binds.forEach((item) => {
      mousetrap.unbind(item.key, item.type!);
    });
    this._binds = [];
  }
}
