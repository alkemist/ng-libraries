export abstract class StateAction<T = any> {
  static readonly key: string;
  abstract payload: T;

  get key() {
    return (this.constructor as typeof StateAction).key;
  }
}
