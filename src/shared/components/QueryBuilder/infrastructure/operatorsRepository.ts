import { Suggestions } from '../domain/types';

class OperatorsRepository {
  async list(): Promise<Suggestions> {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: 'is-empty', label: 'is empty' },
      { value: 'in', label: 'in', description: 'Is one of' },
      { value: 'not-in', label: 'not in', description: 'Is not one of' },
      { value: '=~', label: '=~', description: 'Matches regex' },
      { value: '!~', label: '!~', description: 'Does not match regex' },
    ];
  }
}

export const operatorsRepository = new OperatorsRepository();
