import { inject, Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs';
import { DataStoreApiService } from './data-store-api.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { DataStoreUserInterface } from '../models/data-store-user.interface';

@Injectable({
  providedIn: 'root'
})
export class DataStoreUserService extends DataStoreApiService {
  private loggedUser: DataStoreUserInterface | null = null;

  private http = inject(HttpClient);

  constructor() {
    super();
  }

  login() {
    const callback = `${ window.location.origin }/${ this.configuration.front_callback_path }`
    window.location.href = `${ this.configuration.api_datastore_base_url }login/google?callback=${ callback }`;
  }

  getLoggedUser() {
    return this.loggedUser;
  }

  getProfile() {
    return this.http.get<ApiResponseItemInterface<DataStoreUserInterface>>(
      this.configuration.api_datastore_base_url + 'api/profile',
      {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError(this.handleError),
        tap(data => this.setToken(data.token)),
        tap(data => this.loggedUser = data.item),
        map(data => data.item),
      );
  }
}
