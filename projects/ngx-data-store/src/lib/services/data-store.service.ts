import { inject, Injectable, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom, Observable, of, tap } from 'rxjs';
import { DataStoreApiService } from './data-store-api.service';
import { ApiResponseItemsInterface } from '../models/api-response-items.interface';
import { ApiError } from '../errors/api-error';
import { Router } from '@angular/router';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { ApiResponseInterface } from '../models/api-response.interface';
import { DocumentInterface } from '../models/document.interface';
import { TypeHelper } from '@alkemist/smart-tools';
import { ApiResponseQueryInterface } from '../models/api-response-query.interface';

@Injectable({
  providedIn: 'root'
})
export abstract class DataStoreService<T extends DocumentInterface> extends DataStoreApiService {
  protected abstract _lastUpdated: WritableSignal<Date | null>;
  private http = inject(HttpClient);
  private router = inject(Router);

  protected constructor(
    private itemKey: string
  ) {
    super();
  }

  selectItems() {
    const $data = this.http.get<ApiResponseItemsInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemsInterface<T>>(_, { items: [] })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  searchItems(filters: Partial<T>) {
    const $data = this.http.post<ApiResponseItemsInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey + '/search/items',
      filters,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemsInterface<T>>(_, { items: [] })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  searchItem(filters: Partial<T>) {
    const $data = this.http.post<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey + '/search/item',
      filters,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  selectItem(slug: string) {
    const $data = this.http.get<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/item/' + slug,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  addItem(item: T) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: item } as ApiResponseItemInterface<T>
    }

    const $data = this.http.put<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey,
      this.formatData(item),
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  existAddItem(filter: Partial<T>) {
    const $data = this.http.put<ApiResponseQueryInterface<boolean>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey + '/exist',
      filter,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseQueryInterface<boolean>>(_, { response: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  updateItem(id: string, item: T) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: item } as ApiResponseItemInterface<T>
    }

    const $data = this.http.post<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/item/' + id,
      this.formatData(item),
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  existUpdateItem(id: string, filter: Partial<T>) {
    const $data = this.http.post<ApiResponseQueryInterface<boolean>>(
      this.configuration.api_datastore_base_url + 'api/item/' + id + '/exist',
      filter,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseQueryInterface<boolean>>(_, { response: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  deleteItem(id: string) {
    if (this.configuration.offline_mode) {
      return { token: 'offline', item: null } as ApiResponseItemInterface<T>
    }

    const $data = this.http.delete<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/item/' + id,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  private redirectWithResponse<U extends ApiResponseInterface>(error: ApiError, response: Partial<U>): Observable<U> {
    void this.router.navigate([ this.configuration.front_login_path ]);
    return of({ token: '', ...response } as U);
  }

  private formatData(item: T) {
    const data = TypeHelper.deepClone(item) as Partial<T>;
    delete data.id;
    return data;
  }
}
