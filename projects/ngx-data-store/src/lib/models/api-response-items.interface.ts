import { ApiResponseInterface } from './api-response.interface';

export interface ApiResponseItemsInterface<T> extends ApiResponseInterface {
  items: T[];
}
