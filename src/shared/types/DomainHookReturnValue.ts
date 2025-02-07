export type DomainHookReturnValue<T = any, V = any> = {
  data: Record<string, T>;
  actions: Record<string, V>;
};

// TODO: Christian is struggling with type safefty of my domain hook return values, is this a good idea?
export type DomainHookReturnValueTyped<T = any, V = any> = {
  data: T;
  actions: V;
};
