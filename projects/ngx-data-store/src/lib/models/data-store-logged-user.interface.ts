import { DataStoreUserInterface } from './data-store-user.interface';

export interface DataStoreLoggedUserInterface<T extends Record<string, any> = Record<string, any>> extends DataStoreUserInterface {
  id: string;
  email: string;
  data: T;
}
