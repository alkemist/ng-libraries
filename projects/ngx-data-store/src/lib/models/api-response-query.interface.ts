import { ApiResponseInterface } from './api-response.interface';

export interface ApiResponseQueryInterface<T> extends ApiResponseInterface {
  response: T | null;
}
