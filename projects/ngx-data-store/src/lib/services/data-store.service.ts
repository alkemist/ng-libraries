import { computed, inject, Injectable, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom, Observable, of, tap } from 'rxjs';
import { DataStoreApiService } from './data-store-api.service';
import { ApiResponseItemsInterface } from '../models/api-response-items.interface';
import { ApiError } from '../errors/api-error';
import { Router } from '@angular/router';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { ApiResponseInterface } from '../models/api-response.interface';
import { DocumentBackInterface, DocumentFrontInterface } from '../models/document.interface';
import { DateHelper, TypeHelper } from '@alkemist/smart-tools';
import { ApiResponseQueryInterface } from '../models/api-response-query.interface';
import { UserNotLoggedError } from '../errors/user-not-logged.error';
import { DataStoreUserService } from './data-store-user.service';

@Injectable({
  providedIn: 'root'
})
export abstract class DataStoreService<
  F extends DocumentFrontInterface,
  B extends DocumentBackInterface = Omit<F, 'user' | 'slug'>
> extends DataStoreApiService {
  protected abstract _lastUpdatedPublicItems?: WritableSignal<Date | null>;
  public publicItemsLoaded = computed(() => {
    if (this.configuration.offline_mode || !this._lastUpdatedPublicItems) {
      return true;
    }

    const outdated = this.checkOutdated(this._lastUpdatedPublicItems!());

    if (outdated) {
      this.dispatchPublicItemsFill();
    }

    return !outdated;
  });
  protected abstract _lastUpdatedUserItems?: WritableSignal<Date | null>;
  public userItemsLoaded = computed(() => {
    if (this.configuration.offline_mode || !this._lastUpdatedUserItems) {
      return true;
    }

    const outdated = this.checkOutdated(this._lastUpdatedUserItems!());

    if (outdated) {
      this.dispatchUserItemsFill();
    }

    return !outdated;
  });
  private http = inject(HttpClient);
  private router = inject(Router);

  protected constructor(
    private userService: DataStoreUserService<any>,
    private itemKey: string
  ) {
    super();
  }

  abstract dispatchPublicItemsFill(): void

  abstract dispatchUserItemsFill(): void

  checkToken(token?: string) {
    if (!token) {
      this.userService.logout();
      void this.router.navigate([ this.configuration.front_login_path ]);
      throw new UserNotLoggedError();
    }
  }

  userItems() {
    const $data = this.http.get<ApiResponseItemsInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemsInterface<F>>(_, { items: [] })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  publicItems() {
    const $data = this.http.get<ApiResponseItemsInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/public/'
      + this.configuration.api_project_key + '/' + this.itemKey,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemsInterface<F>>(_, { items: [] })),
      );
    return lastValueFrom($data);
  }

  searchItems(filters: Partial<B>) {
    const $data = this.http.post<ApiResponseItemsInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey
      + '/search/items',
      filters,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemsInterface<F>>(_, { items: [] })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  searchItem(filters: Partial<B>) {
    const $data = this.http.post<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey
      + '/search/item',
      filters,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  userItem(slug: string) {
    const $data = this.http.get<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey +
      '/' + slug,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  publicItem(slug: string) {
    const $data = this.http.get<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/public/'
      + this.configuration.api_project_key + '/' + this.itemKey +
      '/' + slug,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
      );
    return lastValueFrom($data);
  }

  addItem(item: B) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: item as unknown as F } as ApiResponseItemInterface<F>
    }

    const $data = this.http.put<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey,
      this.formatData(item),
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  existAddItem(filter: Partial<F>) {
    const $data = this.http.put<ApiResponseQueryInterface<boolean>>(
      this.configuration.api_datastore_base_url + 'api/store/'
      + this.configuration.api_project_key + '/' + this.itemKey
      + '/exist',
      filter,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseQueryInterface<boolean>>(_, { response: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  updateItem(id: string, item: B) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: item as unknown as F } as ApiResponseItemInterface<F>
    }

    const $data = this.http.post<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/item/'
      + id,
      this.formatData(item),
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  existUpdateItem(id: string, filter: Partial<F>) {
    const $data = this.http.post<ApiResponseQueryInterface<boolean>>(
      this.configuration.api_datastore_base_url + 'api/item/'
      + id + '/exist',
      filter,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseQueryInterface<boolean>>(_, { response: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  deleteItem(id: string) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: null } as ApiResponseItemInterface<F>
    }

    const $data = this.http.delete<ApiResponseItemInterface<F>>(
      this.configuration.api_datastore_base_url + 'api/item/'
      + id,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<F>>(_, { item: null })),
        tap(data => data ? this.checkToken(data.token) : null),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  protected checkOutdated(lastUpdated: Date | null): boolean {
    if (lastUpdated === null) {
      return true;
    }

    if (this.configuration.offline_mode) {
      return false;
    }

    const nbHours = DateHelper.calcHoursAfter(lastUpdated);
    return nbHours >= this.configuration.store_default_max_hour_outdated;
  }

  private redirectWithResponse<U extends ApiResponseInterface>(error: ApiError, response: Partial<U>): Observable<U> {
    void this.router.navigate([ this.configuration.front_login_path ]);
    return of({ token: '', ...response } as U);
  }

  private formatData(item: B) {
    const data = TypeHelper.deepClone(item) as Partial<B>;
    delete data.id;
    return data;
  }
}
