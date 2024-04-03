import { AbstractControl, FormArray, FormControl, FormGroup } from "@angular/forms";
import { FormArrayControlSupervisor, FormArrayGroupSupervisor } from "./form-array-supervisor";
import { FormControlSupervisor } from "./form-control-supervisor";
import { FormGroupSupervisor } from "./form-group-supervisor";
import {
  AbstractForm,
  ArrayType,
  ControlValueType,
  FormArrayGroupInterfaceType,
  FormArrayItemConfigurationType,
  FormArrayItemType,
  FormGroupInterface,
  GetFormArrayGenericClass,
  INTERFACE_TYPE,
  isValueRecordForm,
  ValueFormNullable,
  ValueRecordForm
} from "./form.type";
import { GenericValueRecord, TreeHelper, TypeHelper, ValueKey } from "@alkemist/smart-tools";
import { FormSupervisor } from "./form-supervisor";

export abstract class SupervisorHelper {
  static factory<
    DATA_TYPE,
    FORM_TYPE extends FormArray | FormGroup | FormControl,
    SUPERVISOR_TYPE
  >(
    control: FORM_TYPE,
    parentSupervisor: FormSupervisor,
    determineArrayIndexFn?: ((paths: ValueKey[]) => ValueKey) | undefined,
    itemType?: FormArrayItemConfigurationType<DATA_TYPE, FORM_TYPE>,
    showLog = false
  ): SUPERVISOR_TYPE {
    type DataType = ControlValueType<typeof control>;
    let supervisor;

    if (SupervisorHelper.isFormArray(control)) {
      if (!itemType && control.length === 0) {
        console.error("Impossible to determine children type");
        throw new Error("Impossible to determine children type")
      }

      if (itemType && itemType.type === 'group'
        || control.length > 0 && control.at(0).constructor == FormGroup
      ) {
        if (showLog) {
          console.log('[ArrayGroup] Build supervisor for values : ', control.value);
        }

        supervisor = new FormArrayGroupSupervisor<DATA_TYPE, FormArray>(
          control,
          control.value,
          determineArrayIndexFn,
          itemType as FormArrayItemConfigurationType<ControlValueType<FORM_TYPE>, FormGroup>,
          parentSupervisor,
          showLog
        );
      } else {
        if (showLog) {
          console.log('[ArrayControl] Build supervisor for values : ', control.value);
        }

        supervisor = new FormArrayControlSupervisor<DATA_TYPE>(
          control,
          determineArrayIndexFn,
          itemType as FormArrayItemConfigurationType<ControlValueType<FORM_TYPE>, FormControl>,
          parentSupervisor,
          showLog
        );
      }
    } else if (SupervisorHelper.isFormGroup(control)) {
      if (showLog) {
        console.log('[Group] Build supervisor for values : ', control.value);
      }

      supervisor = new FormGroupSupervisor<DataType, FormGroup>(
        control,
        control.value,
        determineArrayIndexFn,
        itemType as FormArrayItemConfigurationType<ControlValueType<FORM_TYPE>, FormGroup>,
        parentSupervisor,
        showLog
      );
    } else {
      if (showLog) {
        console.log('[Control] Build supervisor for values : ', control.value);
      }

      supervisor = new FormControlSupervisor<DataType>(
        control as FormControl<DataType>,
        determineArrayIndexFn,
        parentSupervisor,
        showLog
      );
    }

    return supervisor as SUPERVISOR_TYPE;
  }

  static isFormGroup(control: FormArray | FormGroup | FormControl): control is FormGroup {
    return control instanceof FormGroup
      || control.constructor === FormGroup
      || control.constructor.name === FormGroup.name
      || control.constructor.name === "FormGroup"
      || Object.getPrototypeOf(control) === FormGroup.prototype
      || Object.is(Object.getPrototypeOf(control), FormGroup.prototype)
      ;
  }

  static isFormArray(control: FormArray | FormGroup | FormControl): control is FormArray {
    return control instanceof FormArray
      || control.constructor === FormArray
      || control.constructor.name === FormArray.name
      || control.constructor.name === "FormArray"
      || Object.getPrototypeOf(control) === FormArray.prototype
      || Object.is(Object.getPrototypeOf(control), FormArray.prototype)
      ;
  }

  static extractFormGroupInterface<
    DATA_TYPE,
    FORM_TYPE extends FormControl | FormGroup,
  >(array: FormArray<FORM_TYPE>): FormArrayItemConfigurationType<DATA_TYPE, FORM_TYPE> {
    const controls: FORM_TYPE[] = array.controls as FORM_TYPE[];
    if (controls.length === 0) {
      console.error("Impossible to determine children type");
      throw new Error("Impossible to determine children type")
    }

    return SupervisorHelper.extractFormGroupItemInterface<DATA_TYPE, FORM_TYPE>(controls[0]);
  }

  static extractFormGroupItemsInterface<DATA_TYPE extends ValueRecordForm>(
    group: FormGroup
  ): FormArrayGroupInterfaceType<DATA_TYPE, FormGroup> {
    const controls = group.controls as Record<keyof DATA_TYPE, AbstractForm>;
    const properties = TreeHelper.keys(controls) as (keyof DATA_TYPE)[];

    return properties.reduce((formGroupInterface: FormArrayGroupInterfaceType<DATA_TYPE, FormGroup>, property: keyof DATA_TYPE) => {
      const control = controls[property] as AbstractForm;
      type DataType = ControlValueType<typeof control>;

      formGroupInterface[property] = SupervisorHelper.extractFormGroupItemInterface<DataType, typeof control>(control) as
        FormArrayGroupInterfaceType<DATA_TYPE, FormGroup>[keyof DATA_TYPE];
      return formGroupInterface;
    }, {} as FormArrayGroupInterfaceType<DATA_TYPE, FormGroup>);
  }

  static extractFormGroupItemInterface<
    DATA_TYPE,
    FORM_TYPE extends AbstractControl
  >(control: FORM_TYPE): FormArrayItemConfigurationType<DATA_TYPE, FORM_TYPE> {
    type DataType = ControlValueType<typeof control>;
    const interfaceType: INTERFACE_TYPE = control instanceof FormGroup
      ? 'group'
      : control instanceof FormArray
        ? 'array'
        : 'control'

    const itemInterface = control instanceof FormGroup
      ? SupervisorHelper.extractFormGroupItemsInterface<DataType>(control as FormGroup)
      : control instanceof FormArray
        ? SupervisorHelper.extractFormGroupInterface<DATA_TYPE, GetFormArrayGenericClass<typeof control>>(control)
        : null;

    return {
      type: interfaceType,
      interface: itemInterface,
      validator: control.validator
    } as FormArrayItemConfigurationType<DATA_TYPE, FORM_TYPE>
  }

  static factoryItem<
    DATA_TYPE,
    FORM_ARRAY_ITEM_TYPE extends FormGroup | FormControl | FormArray,
  >(
    itemInterface: FormArrayItemConfigurationType<DATA_TYPE, FORM_ARRAY_ITEM_TYPE>,
    itemValue: DATA_TYPE
  ): FORM_ARRAY_ITEM_TYPE {
    if (
      TypeHelper.isRecord<ValueFormNullable>(itemValue)
      && TypeHelper.isRecord<isValueRecordForm<DATA_TYPE>>(itemInterface.interface)
    ) {
      return SupervisorHelper.factoryArrayGroupItem<isValueRecordForm<DATA_TYPE>>(
        itemInterface.interface as FormArrayGroupInterfaceType<isValueRecordForm<DATA_TYPE>, FORM_ARRAY_ITEM_TYPE>,
        itemInterface.validator,
        itemValue as isValueRecordForm<DATA_TYPE>
      ) as FORM_ARRAY_ITEM_TYPE;
    } else if (
      TypeHelper.isArray<ValueFormNullable>(itemValue)
      && itemInterface.type !== 'control'
    ) {
      type dataSubItemType = ArrayType<DATA_TYPE>;
      type controlSubItemType = FormArrayItemType<DATA_TYPE>;

      return new FormArray(
        itemValue.map(subItemValue =>
          SupervisorHelper.factoryItem(
            itemInterface.interface as FormArrayItemConfigurationType<dataSubItemType, controlSubItemType>,
            subItemValue as dataSubItemType
          )
        ),
        itemInterface.validator
      ) as FORM_ARRAY_ITEM_TYPE;
    } else {
      return new FormControl<DATA_TYPE | null>(itemValue, itemInterface.validator) as FORM_ARRAY_ITEM_TYPE;
    }
  }

  static factoryArrayGroupItem<
    DATA_TYPE extends ValueRecordForm
  >(
    itemInterface: FormArrayGroupInterfaceType<DATA_TYPE, FormGroup>,
    validator: () => {},
    itemValue: DATA_TYPE,
  ): FormGroup<FormGroupInterface<DATA_TYPE>> {
    const properties = TreeHelper.keys(itemInterface) as (keyof DATA_TYPE)[];

    const formInterface = properties.reduce(
      (
        formGroupInterface: FormGroupInterface<DATA_TYPE>,
        property: keyof DATA_TYPE
      ) => {
        type subItemType = DATA_TYPE[keyof DATA_TYPE];

        formGroupInterface[property] =
          SupervisorHelper.factoryItem(
            itemInterface[property] as FormArrayItemConfigurationType<subItemType, FormArrayItemType<subItemType>>,
            itemValue[property]
          )
        return formGroupInterface;
      }, {} as FormGroupInterface<DATA_TYPE>);

    return new FormGroup<FormGroupInterface<DATA_TYPE>>(formInterface, validator);
  }

  static mergeArraysToMap<VALUE>(keys: string[], values: VALUE[]): GenericValueRecord<VALUE> {
    if (keys.length !== values.length) {
      throw new Error("The number of keys and values must be the same.");
    }

    // Use reduce to create the key/value map

    return keys.reduce((map: GenericValueRecord<VALUE>, key, index) => {
      map[key] = values[index];
      return map;
    }, {});
  }
}
