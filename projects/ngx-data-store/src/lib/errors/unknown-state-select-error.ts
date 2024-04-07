import { StateError } from './state-error';

export class UnknownStateSelectError extends StateError {
  constructor(selectKey: string) {
    super(`Unknown select "${ selectKey }"`);
  }
}
