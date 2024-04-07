import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { inject } from '@angular/core';
import { DataStoreUserService } from '../services/data-store-user.service';
import { ApiError } from '../errors/api-error';
import { DataStoreConfigurationProvider } from '../services/data-store-configuration.provider';

export const logginInGuard: () => Observable<Promise<boolean>> = () => {
  const userService = inject(DataStoreUserService);
  const router = inject(Router);
  const configuration = inject(DataStoreConfigurationProvider);

  return userService.getProfile().pipe(
    catchError((_: ApiError) => {
      // Renvoyé au map
      return of(false);
    }),
    map(async user => {
      if (user) {
        await router.navigate([ configuration.front_logged_path ]);
      }
      return !user;
    }));
};
