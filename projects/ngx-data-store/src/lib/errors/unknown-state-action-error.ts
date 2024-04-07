import { StateError } from './state-error';

export class UnknownStateActionError extends StateError {
  constructor(actionKey: string) {
    super(`Unknown action "${ actionKey }"`);
  }
}
