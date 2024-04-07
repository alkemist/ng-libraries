import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, Observable } from 'rxjs';
import { inject } from '@angular/core';
import { DataStoreUserService } from '../services/data-store-user.service';
import { ApiError } from '../errors/api-error';
import { DataStoreConfigurationProvider } from '../services/data-store-configuration.provider';

export const loggedInGuard: CanActivateFn = (): Observable<boolean> => {
  const userService = inject(DataStoreUserService);
  const router = inject(Router);
  const configuration = inject(DataStoreConfigurationProvider);

  return userService.getProfile().pipe(
    catchError(async (_: ApiError) => {
      // Renvoyé au map
      return false;
    }),
    map(user => {
      if (!user) {
        void router.navigate([ configuration.front_login_path ]);
      }

      return !!user;
    }));
};
