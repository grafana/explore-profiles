import plugin from '../../plugin.json';

class UserStorage {
  #storage: Storage = window.localStorage;

  KEYS = {
    SETTINGS: `${plugin.id}.userSettings`,
    GITHUB_INTEGRATION: `${plugin.id}.gitHubIntegration`,
  };

  has(itemName: string): boolean {
    return this.#storage.hasOwnProperty(itemName);
  }

  get(itemName: string): null | any {
    if (!this.has(itemName)) {
      return null;
    }

    try {
      return JSON.parse(this.#storage.getItem(itemName) as string);
    } catch (error) {
      console.error(`Error parsing JSON for storage item "${itemName}"!`);
      console.error(error);
      return null;
    }
  }

  set(itemName: string, value: any): void {
    try {
      this.#storage.setItem(itemName, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item "${itemName}"!`);
      console.error(error);
    }
  }
}

export const userStorage = new UserStorage();
