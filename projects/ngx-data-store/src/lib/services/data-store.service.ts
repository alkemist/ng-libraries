import { inject, Injectable, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom, Observable, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponseItemsInterface } from '../models/api-response-items.interface';
import { ApiError } from '../errors/api-error';
import { Router } from '@angular/router';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { ApiResponseInterface } from '../models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export abstract class DataStoreService<T> extends ApiService {
  protected abstract _lastUpdated: WritableSignal<Date | null>;
  private http = inject(HttpClient);
  private router = inject(Router);

  protected constructor(
    private itemKey: string
  ) {
    super();
  }

  protected abstract _items: WritableSignal<T[]>;

  get items() {
    return this._items.asReadonly();
  }

  protected abstract _item: WritableSignal<T | null>;

  get item() {
    return this._item.asReadonly();
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

  selectItem(id: string) {
    const $data = this.http.get<ApiResponseItemInterface<T>>(
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

  addItem<T>(item: T) {
    const $data = this.http.put<ApiResponseItemInterface<T>>(
      this.configuration.api_datastore_base_url + 'api/store/' +
      this.configuration.api_project_key + '/' + this.itemKey,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(_ => this.redirectWithResponse<ApiResponseItemInterface<T>>(_, { item: null })),
        tap(data => data ? this.setToken(data.token) : null),
      );
    return lastValueFrom($data);
  }

  updateItem<T>(id: string, item: T) {
    const $data = this.http.post<ApiResponseItemInterface<T>>(
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

  deleteItem(id: string) {
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
}
