import plugin from '../../plugin.json';

class UserStorage {
  #storage: Storage = window.localStorage;

  KEYS = {
    SETTINGS: `${plugin.id}.userSettings`,
  };

  async has(itemName: string): Promise<boolean> {
    return this.#storage.hasOwnProperty(itemName);
  }

  async get(itemName: string): Promise<null | any> {
    if (!this.has(itemName)) {
      return null;
    }

    try {
      return JSON.parse(this.#storage.getItem(itemName) as string);
    } catch (error) {
      console.error(`Error parsing JSON for storage item "${itemName}":`, error);
      return null;
    }
  }

  async set(itemName: string, value: any): Promise<void> {
    this.#storage.setItem(itemName, JSON.stringify(value));
  }
}

export const userStorage = new UserStorage();
