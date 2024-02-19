export type DomainHookReturnValue<T = any, V = any> = {
  data: Record<string, T>;
  actions: Record<string, V>;
};
