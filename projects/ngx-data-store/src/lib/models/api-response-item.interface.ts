import { ApiResponseInterface } from './api-response.interface';

export interface ApiResponseItemInterface<T> extends ApiResponseInterface {
  item: T | null;
}
