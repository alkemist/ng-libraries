import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormSupervisorService } from './form-supervisor.service';

/**
 * @ignore
 */
@NgModule()
class FormSupervisorRootModule extends NgModule {

}

@NgModule({
  declarations: [],
  imports: [],
  exports: [],
  providers: [
    FormSupervisorService
  ],
  bootstrap: []
})
export class FormSupervisorModule extends NgModule {
  ngModule = FormSupervisorRootModule;
  type = FormSupervisorModule;
  override declarations = [];
  override imports = [];
  override exports = [];
  override providers = [ FormSupervisorService ];
  override bootstrap = [];

  static forRoot(): ModuleWithProviders<FormSupervisorRootModule> {
    return {
      ngModule: FormSupervisorRootModule,
      providers: [
        FormSupervisorService,
      ]
    };
  }
}
