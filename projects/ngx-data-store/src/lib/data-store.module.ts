import { ModuleWithProviders, NgModule } from '@angular/core';
import { Configuration } from './models/configuration';
import { ConfigurationProvider } from './services/configuration.service';
import { UserService } from './services/user.service';

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
    UserService
  ],
  bootstrap: []
})
export class DataStoreModule extends NgModule {
  ngModule = DataStoreRootModule;
  type = DataStoreModule;
  override declarations = [];
  override imports = [];
  override exports = [];
  override providers = [ UserService ];
  override bootstrap = [];

  static forRoot(configuration: Configuration): ModuleWithProviders<DataStoreRootModule> {
    return {
      ngModule: DataStoreRootModule,
      providers: [
        UserService,
        {
          provide: ConfigurationProvider,
          useValue: configuration,
        },
      ]
    };
  }
}
