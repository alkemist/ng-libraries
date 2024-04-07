import { DataStoreUserInterface } from './data-store-user.interface';

export interface DocumentBackInterface {
  id: string;
  name: string;
}

export interface DocumentFrontInterface extends DocumentBackInterface {
  slug: string;
  user: DataStoreUserInterface;
}

export interface DocumentFormInterface extends DocumentBackInterface {
  slug?: string;
  user?: DataStoreUserInterface;
}
