export class StateError extends Error {
  constructor(error: string) {
    super(`[StateError] ${ error }`);
  }
}
