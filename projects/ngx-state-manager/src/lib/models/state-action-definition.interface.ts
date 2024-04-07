import { StateAction } from './state-action';

export interface StateActionDefinition<A extends Object = Object, T = any> {
  key: string;

  new(payload: T): StateAction<T>;
}
