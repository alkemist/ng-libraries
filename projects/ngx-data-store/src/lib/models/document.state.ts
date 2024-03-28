import { StateContext } from '@alkemist/ngx-state-manager';
import { DocumentInterface } from './document.interface';
import { ValueRecord } from '@alkemist/smart-tools';

export interface DocumentStateInterface<T extends DocumentInterface> extends ValueRecord {
  lastUpdated: Date | null,
  items: T[];
  item: T | null;
}

export class DocumentState<T extends DocumentInterface> {
  static lastUpdated<T extends DocumentInterface>(state: DocumentStateInterface<T>): Date | null {
    return state.lastUpdated;
  }

  static item<T extends DocumentInterface>(state: DocumentStateInterface<T>): T | null {
    return state.item;
  }

  static items<T extends DocumentInterface>(state: DocumentStateInterface<T>): T[] {
    return state.items;
  }

  fill(context: StateContext<DocumentStateInterface<T>>, payload: T[]) {
    context.patchState({
      items: payload,
      lastUpdated: new Date()
    });
  }

  get(context: StateContext<DocumentStateInterface<T>>, payload: T | null) {
    context.patchState({
      item: payload,
    });
  }

  add(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.addItem('items', payload);
    context.patchState({
      item: payload,
    });
  }

  update(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.setItem('items', payload);
    context.patchState({
      item: payload,
    });
  }

  patch(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.patchItem('items', payload);
    context.patchState({
      item: payload,
    });
  }

  remove(context: StateContext<DocumentStateInterface<T>>, payload: T) {
    context.removeItem('items', payload)
    context.patchState({
      item: null,
    });
  }
}
