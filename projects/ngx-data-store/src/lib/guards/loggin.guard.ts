import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { ApiError } from '../errors/api-error';
import { ConfigurationProvider } from '../services/configuration.service';

export const logginInGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);
  const configuration = inject(ConfigurationProvider);

  return userService.getProfile().pipe(
    catchError((_: ApiError) => {
      return of(false);
    }),
    map(user => {
      if (user) {
        void router.navigate([ configuration.front_logged_path ]);
      }
      return !user;
    }));
};
