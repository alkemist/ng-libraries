import { ModuleWithProviders, NgModule } from '@angular/core';
import { Configuration } from './models/configuration';
import { DataStoreConfigurationProvider } from './services/data-store-configuration.provider';
import { DataStoreUserService } from './services/data-store-user.service';

/**
 * @ignore
 */
@NgModule()
class DataStoreRootModule extends NgModule {

}

@NgModule({
  declarations: [],
  imports: [],
  exports: [],
  providers: [
    DataStoreUserService
  ],
  bootstrap: []
})
export class DataStoreModule extends NgModule {
  ngModule = DataStoreRootModule;
  type = DataStoreModule;
  override declarations = [];
  override imports = [];
  override exports = [];
  override providers = [ DataStoreUserService ];
  override bootstrap = [];

  static forRoot(configuration: Configuration): ModuleWithProviders<DataStoreRootModule> {
    return {
      ngModule: DataStoreRootModule,
      providers: [
        DataStoreUserService,
        {
          provide: DataStoreConfigurationProvider,
          useValue: configuration,
        },
      ]
    };
  }
}
