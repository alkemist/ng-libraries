import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, lastValueFrom, map, Observable, tap } from 'rxjs';
import { DataStoreApiService } from './data-store-api.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { DataStoreLoggedUserInterface } from '../models/data-store-logged-user.interface';

@Injectable({
  providedIn: 'root'
})
export class DataStoreUserService<T extends Record<string, any>> extends DataStoreApiService {
  private http: HttpClient = inject(HttpClient);

  constructor() {
    super();
  }

  private _loggedUser: WritableSignal<DataStoreLoggedUserInterface<T> | null> = signal(null);

  get loggedUser() {
    return this._loggedUser.asReadonly();
  }

  login() {
    const callback = `${ window.location.origin }/${ this.configuration.front_callback_path }`
    window.location.href = `${ this.configuration.api_datastore_base_url }` +
      `login/${this.configuration.api_project_key}` +
      `?callback=${ callback }`;
  }

  async logout() {
    const $response = this.http.get(
      this.configuration.api_datastore_base_url + 'api/logout/' + this.configuration.api_project_key,
      {
        headers: this.buildHeaders()
      });

    await lastValueFrom($response);

    this.setToken('');
    this._loggedUser.set(null);
  }

  async getLoggedUser() {
    const loggedUser = this._loggedUser();

    if (loggedUser === null) {
      const $data = this.getProfile();
      return await lastValueFrom($data);
    }

    return loggedUser;
  }

  getProfile(): Observable<DataStoreLoggedUserInterface<T>> {
    return this.http.get<ApiResponseItemInterface<DataStoreLoggedUserInterface<T>>>(
      this.configuration.api_datastore_base_url + 'api/profile/' + this.configuration.api_project_key,
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(this.handleError),
        tap(data => this._loggedUser.set(data.item)),
        tap(data => data.token ? this.setToken(data.token) : ''),
        map(data => data.item),
      ) as Observable<DataStoreLoggedUserInterface<T>>;
  }
}
