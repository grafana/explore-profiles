import { Suggestions } from '../domain/types';

class OperatorsRepository {
  async list(): Promise<Suggestions> {
    return [
      { value: '=', label: '=', description: 'Equals' },
      { value: '!=', label: '!=', description: 'Not equal' },
      { value: '=~', label: '=~', description: 'Matches regex' },
      { value: '!~', label: '!~', description: 'Does not match regex' },
      { value: 'is-empty', label: 'is empty' },
      // TODO: enable after exhaustive testing
      // { value: 'in', label: 'in' },
    ];
  }
}

export const operatorsRepository = new OperatorsRepository();
