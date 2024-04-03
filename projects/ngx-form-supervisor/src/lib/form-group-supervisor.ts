import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { GenericValueRecord, TreeHelper, ValueKey } from "@alkemist/smart-tools";
import { FormSupervisor } from "./form-supervisor";
import { SupervisorHelper } from "./supervisor.helper";
import {
  ArrayType,
  ControlValueType,
  FormArrayItemConfigurationType,
  FormChange,
  FormGroupInterface,
  GetFormGroupGenericClass,
  GroupRawValueType,
  GroupValueType,
  PartialGroupValueType,
  SupervisorType
} from "./form.type";
import { FormOptions } from "./form.interface";
import { FormArraySupervisor } from "./form-array-supervisor";

type SupervisorRecord<
  DATA_TYPE,
  FORM_GROUP_TYPE extends FormGroup<FormGroupInterface<DATA_TYPE>>,
> = {
  [K in keyof DATA_TYPE]: SupervisorType<
    DATA_TYPE[K],
    GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K]
  >
}

export class FormGroupSupervisor<
  DATA_TYPE,
  FORM_GROUP_TYPE extends FormGroup,
>
  extends FormSupervisor<
    DATA_TYPE,
    FORM_GROUP_TYPE
  > {

  supervisors: SupervisorRecord<DATA_TYPE, FORM_GROUP_TYPE>;

  constructor(
    protected group: FORM_GROUP_TYPE,
    data: DATA_TYPE = group.value as DATA_TYPE,
    determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
    protected configuration?: FormArrayItemConfigurationType<DATA_TYPE, FORM_GROUP_TYPE>,
    parentSupervisor?: FormSupervisor,
    showLog = false
  ) {
    super(determineArrayIndexFn, parentSupervisor);
    this.showLog = showLog;

    this.supervisors = this.properties
      .reduce((supervisors: SupervisorRecord<DATA_TYPE, FORM_GROUP_TYPE>, property: keyof DATA_TYPE) => {
        const control = this.controls[property] as FormGroup | FormArray | FormControl;
        type DataType = ControlValueType<typeof control>;
        type SubDataType = ArrayType<DataType>;

        supervisors[property] = SupervisorHelper.factory<
          SubDataType,
          typeof control,
          SupervisorType<
            DATA_TYPE[any],
            GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[any]
          >
        >(
          control,
          this,
          determineArrayIndexFn,
          this.configuration?.interface[property],
          this.showLog,
        );

        return supervisors;
      }, {} as SupervisorRecord<DATA_TYPE, FORM_GROUP_TYPE>);

    this.resetInitialValue();

    this.sub.add(this.valueChanges.subscribe((value) => {
      if (this.showLog) {
        console.log('[Group] Change detected', value)
      }

      this.onChange(value)
    }));
  }

  get form(): FORM_GROUP_TYPE {
    return this.group;
  }

  get valid(): boolean {
    return this.form.valid;
  }

  get value(): GroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE> {
    return this.form.value as GroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>;
  }

  get valueChanges(): Observable<GroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>> {
    return this.form.valueChanges as Observable<GroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>>;
  }

  get controls() {
    return this.form.controls as GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>;
  }

  private get properties() {
    return TreeHelper.keys(this.controls) as (keyof DATA_TYPE)[];
  }

  setValue(value: GroupRawValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>, options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;
    if (this.showLog) {
      console.log('[Group] Set value', value)
    }

    this.properties.forEach((property) => {
      if (this.showLog) {
        console.log('[Group] Set value for key', property,
          value[property],
          (this.get(property) as FormSupervisor).constructor.name,
        );
      }

      (this.get(property) as FormSupervisor).setValue(value[property], { emitEvent: false, notifyParent: false });
    });

    this.form.setValue(value, { emitEvent });

    this.checkOptions(options);
  }

  override patchValue(value: PartialGroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>, options?: FormOptions, notifyParent = true) {
    const emitEvent = options?.emitEvent ?? true;
    if (this.showLog) {
      console.log('[Group] Patch value', value)
    }

    const properties = TreeHelper.keys(value) as (keyof DATA_TYPE)[];

    properties.forEach((property) => {
      (this.get(property) as FormSupervisor).patchValue(value[property], { emitEvent: false, notifyParent: false });
    });

    this.form.patchValue(
      value as GroupRawValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>,
      { emitEvent }
    );

    this.checkOptions(options);
  }

  override update(): void {
    const options = { emitEvent: false };

    if (this.showLog) {
      console.log('[Group] Parent notified');
    }

    const values = this.properties.map((property) =>
      (this.get(property) as FormSupervisor).value
    );

    const value = SupervisorHelper.mergeArraysToMap(this.properties as string[], values);

    this.form.setValue(value, options);

    this.checkOptions(options);
  }

  reset(options?: FormOptions) {
    this.form.reset(undefined, options);

    this.checkOptions(options);
  }

  clear(options?: FormOptions) {
    this.properties.forEach((property) => {
      const supervisor = this.get(property);

      if (supervisor instanceof FormArraySupervisor || supervisor instanceof FormGroupSupervisor) {
        supervisor.clear({ emitEvent: false, notifyParent: false })
      } else {
        (supervisor as FormSupervisor).reset({ emitEvent: false, notifyParent: false });
      }
    })

    this.checkOptions(options);
  }

  override updateInitialValue(value: GroupRawValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>) {
    this.properties.forEach((property) => {
      (this.get(property) as FormSupervisor).updateInitialValue(value[property]);
    })

    super.updateInitialValue(value);
  }

  override resetInitialValue() {
    this.properties.forEach((property) => {
      (this.get(property) as FormSupervisor).resetInitialValue();
    })

    super.resetInitialValue();
  }

  override restore(options?: FormOptions) {
    this.properties.forEach((property) => {
      (this.get(property) as FormSupervisor).restore({ emitEvent: false, notifyParent: false });
    });

    super.restore();

    this.checkOptions(options);
  }

  get<K extends keyof DATA_TYPE>(property: K)
    : SupervisorType<DATA_TYPE[K], GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K]> {
    return this.supervisors[property] as SupervisorType<DATA_TYPE[K], GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K]>;
  }

  getFormProperty<K extends keyof DATA_TYPE>(property: K)
    : GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K] {
    return (this.supervisors[property] as FormSupervisor).form as GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K];
  }

  override getChanges() {
    const changes = this.properties.map((property) =>
      this.compareEngine.getRightState(property.toString())
    ) as FormChange[];

    return SupervisorHelper.mergeArraysToMap(this.properties as string[], changes) as GenericValueRecord<FormChange>;
  }

  override enableLog() {
    super.enableLog();
    const properties = TreeHelper.keys(this.controls) as (keyof DATA_TYPE)[];
    properties.forEach((property) => {
      (this.get(property) as FormSupervisor).enableLog();
    });
  }

  override disableLog() {
    super.disableLog();
    this.properties.forEach((property) => {
      (this.get(property) as FormSupervisor).disableLog();
    });
  }
}
