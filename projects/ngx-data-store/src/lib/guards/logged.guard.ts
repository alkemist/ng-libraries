import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { inject } from '@angular/core';
import { DataStoreUserService } from '../services/data-store-user.service';
import { ApiError } from '../errors/api-error';
import { DataStoreConfigurationProvider } from '../services/data-store-configuration.provider';

export const loggedInGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const userService = inject(DataStoreUserService);
  const router = inject(Router);
  const configuration = inject(DataStoreConfigurationProvider);

  return userService.getProfile().pipe(
    catchError((_: ApiError) => {
      void router.navigate([ configuration.front_login_path ]);
      return of(false);
    }),
    map(user => {
      return !!user;
    }));
};
