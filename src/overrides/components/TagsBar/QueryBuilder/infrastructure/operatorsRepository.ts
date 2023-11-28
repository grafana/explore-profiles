import { Suggestions } from '../domain/types';

class OperatorsRepository {
  async list(): Promise<Suggestions> {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: '=~', label: '=~' },
      { value: '!~', label: '!~' },
      // TODO: enable after exhaustive testing
      // { value: 'in', label: 'in' },
    ];
  }
}

export const operatorsRepository = new OperatorsRepository();
