import { inject, Injectable, Type } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { StateAction, StateManager } from '@alkemist/ngx-state-manager';
import { DocumentBackInterface, DocumentFrontInterface } from '../models/document.interface';
import { UnknownStateActionError } from '../errors/unknown-state-action-error';
import { StateSelectFunction } from '@alkemist/ngx-state-manager/lib/models/state-select-function.type';
import { DocumentState, DocumentStateInterface } from '../models/document.state';
import { UnknownStateSelectError } from '../errors/unknown-state-select-error';
import { DataStoreUserService } from './data-store-user.service';

@Injectable({
  providedIn: 'root'
})
export abstract class DataStoreStateService<
  F extends DocumentFrontInterface,
  B extends DocumentBackInterface = Omit<F, 'user' | 'slug'>
> extends DataStoreService<F, B> {
  private stateManager = inject(StateManager);

  protected constructor(
    userService: DataStoreUserService<any>,
    itemKey: string,
    private stateClass: Type<DocumentState<F>>,
    private PublicItemsSelect: StateSelectFunction<DocumentStateInterface<F>, F[]> | null = null,
    private UserItemsSelect: StateSelectFunction<DocumentStateInterface<F>, F[]> | null = null,
    private FillPublicItemsAction: Type<StateAction> | null = null,
    private FillUserItemsAction: Type<StateAction> | null = null,
    private GetAction: Type<StateAction> | null = null,
    private AddAction: Type<StateAction> | null = null,
    private UpdateAction: Type<StateAction> | null = null,
    private DeleteAction: Type<StateAction> | null = null,
    private ResetAction: Type<StateAction> | null = null,
  ) {
    super(userService, itemKey);
  }

  selectPublicItems(): Promise<F[]> {
    if (!this.PublicItemsSelect) {
      throw new UnknownStateSelectError("PublicItemsSelect")
    }

    if (this.checkOutdated(this._lastUpdatedPublicItems!())) {
      return this.dispatchPublicItemsFill();
    }

    return new Promise(resolve =>
      resolve(this.stateManager.select(this.stateClass, this.PublicItemsSelect!)));
  }

  selectUserItems(): Promise<F[]> {
    if (!this.UserItemsSelect) {
      throw new UnknownStateSelectError("UserItemsSelect")
    }

    if (this.checkOutdated(this._lastUpdatedUserItems!())) {
      return this.dispatchUserItemsFill();
    }

    return new Promise(resolve =>
      resolve(this.stateManager.select(this.stateClass, this.UserItemsSelect!)));
  }

  async dispatchPublicItemsFill() {
    if (!this.FillPublicItemsAction) {
      throw new UnknownStateActionError("FillPublicItemsAction")
    }

    const data = await this.publicItems();

    this.stateManager.dispatch(
      new this.FillPublicItemsAction(data.items)
    )
    return data.items;
  }

  async dispatchUserItemsFill() {
    if (!this.FillUserItemsAction) {
      throw new UnknownStateActionError("FillUserItemsAction")
    }

    const data = await this.userItems();

    if (data.token) {
      this.stateManager.dispatch(
        new this.FillUserItemsAction(data.items)
      )
      return data.items;
    }
    return [];
  }

  async dispatchPublicItem(slug: string) {
    if (!this.GetAction) {
      throw new UnknownStateActionError("GetAction")
    }

    const data = await this.publicItem(slug);

    this.stateManager.dispatch(
      new this.GetAction(data.item)
    )
    return data.item;
  }

  async dispatchUserItem(slug: string) {
    if (!this.GetAction) {
      throw new UnknownStateActionError("GetAction")
    }

    const data = await this.userItem(slug);

    if (data.token) {
      this.stateManager.dispatch(
        new this.GetAction(data.item)
      )
      return data.item;
    }
    return null;
  }

  async dispatchAdd(item: B) {
    if (!this.AddAction) {
      throw new UnknownStateActionError("AddAction")
    }

    const data = await this.addItem(item);

    if (data.token) {
      this.stateManager.dispatch(
        new this.AddAction(data.item)
      )
      return data.item;
    }
    return null;
  }

  async dispatchUpdate(id: string, item: B) {
    if (!this.UpdateAction) {
      throw new UnknownStateActionError("UpdateAction")
    }

    const data = await this.updateItem(id, item);

    if (data.token) {
      this.stateManager.dispatch(
        [
          new this.UpdateAction(data.item),
        ]
      )
      return data.item;
    }
    return null;
  }

  async dispatchDelete(id: string) {
    if (!this.DeleteAction) {
      throw new UnknownStateActionError("DeleteAction")
    }

    const data = await this.deleteItem(id);

    if (data.token) {
      this.stateManager.dispatch(
        [
          new this.DeleteAction(),
        ]
      )
      return data.item;
    }
    return null;
  }

  async dispatchReset() {
    if (!this.ResetAction) {
      throw new UnknownStateActionError("ResetAction")
    }

    this.stateManager.dispatch(
      [
        new this.ResetAction(),
      ]
    )
  }
}
