import { StateContext } from '@alkemist/ngx-state-manager';
import { DocumentFrontInterface } from './document.interface';
import { ValueRecord } from '@alkemist/smart-tools';

export interface DocumentStateInterface<
  F extends DocumentFrontInterface
> extends ValueRecord {
  publicItems: F[];
  lastUpdatedPublicItems: Date | null,
  userItems: F[];
  lastUpdatedUserItems: Date | null,
  item: F | null;
}

export class DocumentState<T extends DocumentFrontInterface> {
  static lastUpdatedPublicItems<T extends DocumentFrontInterface>(state: DocumentStateInterface<T>): Date | null {
    return state.lastUpdatedPublicItems;
  }

  static lastUpdatedUserItems<T extends DocumentFrontInterface>(state: DocumentStateInterface<T>): Date | null {
    return state.lastUpdatedUserItems;
  }

  static publicItems<T extends DocumentFrontInterface>(state: DocumentStateInterface<T>): T[] {
    return state.publicItems;
  }

  static userItems<T extends DocumentFrontInterface>(state: DocumentStateInterface<T>): T[] {
    return state.userItems;
  }

  static item<T extends DocumentFrontInterface>(state: DocumentStateInterface<T>): T | null {
    return state.item;
  }

  fillPublicItems(context: StateContext<DocumentStateInterface<T>>, payload: T[]) {
    context.patchState({
      publicItems: payload,
      lastUpdatedPublicItems: new Date()
    });
  }

  fillUserItems(context: StateContext<DocumentStateInterface<T>>, payload: T[]) {
    context.patchState({
      userItems: payload,
      lastUpdatedUserItems: new Date()
    });
  }

  get(context: StateContext<DocumentStateInterface<T>>, payload: T | null) {
    context.patchState({
      item: payload,
    });
  }

  add(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.addItem('publicItems', payload);
    context.addItem('userItems', payload);
    context.patchState({
      item: payload,
    });
  }

  update(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.setItem('publicItems', payload);
    context.setItem('userItems', payload);
    context.patchState({
      item: payload,
    });
  }

  patch(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.patchItem('publicItems', payload);
    context.patchItem('userItems', payload);
    context.patchState({
      item: payload,
    });
  }

  remove(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.removeItem('publicItems', payload)
    context.removeItem('userItems', payload)
    context.patchState({
      item: null,
    });
  }

  reset(context: StateContext<DocumentStateInterface<T>>, payload: void) {
    context.patchState({
      item: null,
    });
  }
}
