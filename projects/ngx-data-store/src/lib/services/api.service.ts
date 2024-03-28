import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { ApiError } from '../errors/api-error';
import { ConfigurationProvider } from './configuration.service';
import { inject } from '@angular/core';

export abstract class ApiService {
  protected configuration = inject(ConfigurationProvider);

  protected constructor() {
  }


  public setToken(token: string) {
    localStorage.setItem(this.configuration.local_storage_auth_key, token);
  }

  protected getToken() {
    return localStorage.getItem(this.configuration.local_storage_auth_key) ?? '';
  }

  protected buildHeaders() {
    return new HttpHeaders({
      'X-AUTH-TOKEN': this.getToken()
    })
  }

  protected handleError(error: HttpErrorResponse) {
    return throwError(
      () =>
        new ApiError(error.status, error.message)
    );
  }
}
