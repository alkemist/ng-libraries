export class UserNotLoggedError extends Error {
  constructor() {
    super('[Identification] User not logged');
  }
}
