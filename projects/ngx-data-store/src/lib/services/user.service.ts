import { inject, Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponseItemInterface } from '../models/api-response-item.interface';
import { UserInterface } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiService {
  private loggedUser: UserInterface | null = null;

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
    return this.http.get<ApiResponseItemInterface<UserInterface>>(
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
