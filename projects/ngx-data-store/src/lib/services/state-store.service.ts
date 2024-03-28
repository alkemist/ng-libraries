import { inject, Injectable, Type } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { StateActionClass, StateManager } from '@alkemist/ngx-state-manager';
import { DateHelper } from '@alkemist/smart-tools';

@Injectable({
  providedIn: 'root'
})
export abstract class StateStoreService<T> extends DataStoreService<T> {
  protected maxHourOutdated = this.configuration.store_default_max_hour_outdated;

  private stateManager = inject(StateManager);

  protected constructor(
    itemKey: string,
    private FillAction: Type<StateActionClass>,
    private GetAction: Type<StateActionClass>,
    private AddAction: Type<StateActionClass>,
    private UpdateAction: Type<StateActionClass>,
    private DeleteAction: Type<StateActionClass>,
  ) {
    super(itemKey);
  }

  async checkStoreOutdated() {
    if (this.storeIsOutdated()) {
      return this.fill();
    }
  }

  async fill() {
    const data = await this.selectItems();

    if (data.token) {
      this.stateManager.dispatch(
        new this.FillAction(data.items)
      )
    }
  }

  async get(id: string) {
    const data = await this.selectItem(id);

    if (data.token) {
      this.stateManager.dispatch(
        new this.GetAction(data.item)
      )
    }
  }

  async add(item: T) {
    const data = await this.addItem(item);

    if (data.token) {
      this.stateManager.dispatch(
        new this.AddAction(data.item)
      )
    }
  }

  async update(id: string, item: T) {
    const data = await this.updateItem(id, item);

    if (data.token) {
      this.stateManager.dispatch(
        [
          new this.UpdateAction(data.item),
        ]
      )
    }
  }

  async delete(id: string) {
    const data = await this.deleteItem(id);

    if (data.token) {
      this.stateManager.dispatch(
        [
          new this.DeleteAction(data.item),
        ]
      )
    }
  }

  storeIsOutdated(): boolean {
    /*if (environment["APP_OFFLINE"]) {
      return false;
    }*/

    const lastUpdated = this._lastUpdated();
    if (lastUpdated === null) {
      return true;
    }

    const nbHours = DateHelper.calcHoursAfter(lastUpdated);
    return nbHours >= this.maxHourOutdated;
  }
}
