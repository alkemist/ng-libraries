import { StateManager } from './state-manager.service';
import { ModuleWithProviders, NgModule } from '@angular/core';

/**
 * @ignore
 */
@NgModule()
class StateManagerRootModule extends NgModule {

}

@NgModule({
  declarations: [],
  imports: [],
  exports: [],
  providers: [
    StateManager
  ],
  bootstrap: []
})
export class StateManagerModule extends NgModule {
  ngModule = StateManagerRootModule;
  type = StateManagerModule;
  override declarations = [];
  override imports = [];
  override exports = [];
  override providers = [ StateManager ];
  override bootstrap = [];

  static forRoot(): ModuleWithProviders<StateManagerRootModule> {
    return {
      ngModule: StateManagerRootModule,
      providers: [ StateManager ]
    };
  }
}
