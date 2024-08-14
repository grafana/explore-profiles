import { Suggestions } from '../domain/types';

class OperatorsRepository {
  async list(): Promise<Suggestions> {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: '=~', label: '=~' },
      { value: '!~', label: '!~' },
      { value: 'is-empty', label: 'is empty' },
      { value: 'in', label: 'in' },
    ];
  }
}

export const operatorsRepository = new OperatorsRepository();
