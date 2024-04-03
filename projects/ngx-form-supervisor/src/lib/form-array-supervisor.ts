import { TypeHelper, ValueKey } from "@alkemist/smart-tools";
import { Observable } from "rxjs";
import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { FormSupervisor } from "./form-supervisor";
import { SupervisorHelper } from "./supervisor.helper";
import { ControlValueType, FormArrayItemConfigurationType, FormChange, GetFormArrayGenericClass } from "./form.type";
import { FormOptions } from "./form.interface";
import { FormGroupSupervisor } from "./form-group-supervisor";
import { FormControlSupervisor } from "./form-control-supervisor";

export abstract class FormArraySupervisor<
  DATA_TYPE,
  FORM_TYPE extends FormArray,
  SUPERVISOR_TYPE extends FormSupervisor<DATA_TYPE> =
    GetFormArrayGenericClass<FORM_TYPE> extends FormGroup
      ? FormGroupSupervisor<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>
      : FormControlSupervisor<DATA_TYPE>,
> extends FormSupervisor<
  DATA_TYPE[],
  FORM_TYPE
> {
  protected itemType: FormArrayItemConfigurationType<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>;
  protected supervisors: SUPERVISOR_TYPE[] = [];
  protected _items: FORM_TYPE;

  protected constructor(
    items: FORM_TYPE,
    determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
    itemType?: FormArrayItemConfigurationType<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>,
    parentSupervisor?: FormSupervisor,
    showLog = false
  ) {
    super(determineArrayIndexFn, parentSupervisor);
    this.showLog = showLog;

    this._items = items;
    this.itemType = itemType ?? SupervisorHelper.extractFormGroupInterface<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>(this._items);

    this.resetInitialValue();

    this.onChange();

    this.sub.add(this.valueChanges.subscribe((itemsValue) => {
      if (this.showLog) {
        console.log('[Array] Change detected', itemsValue)
      }

      this.onChange(itemsValue)
    }));
  }

  get form(): FORM_TYPE {
    return this._items;
  }

  get valid(): boolean {
    return this._items.valid;
  }

  get length(): number {
    return this._items.length;
  }

  get value(): DATA_TYPE[] | undefined {
    return this._items.value;
  }

  get valueChanges(): Observable<ControlValueType<FormArray<GetFormArrayGenericClass<FORM_TYPE>>>> {
    return this._items.valueChanges as Observable<ControlValueType<FormArray<GetFormArrayGenericClass<FORM_TYPE>>>>;
  }

  setValue(itemsValue: DATA_TYPE[] | undefined, options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    if (this.showLog) {
      console.log('[Array] Set value', itemsValue)
      if (itemsValue) {
        console.log('[Array] From ', this._items.length, " => ", itemsValue?.length);
      }
    }

    if (itemsValue) {
      itemsValue.forEach(
        (itemValue, index) => {
          if (index < this._items.length) {
            this.at(index).setValue(itemValue, { emitEvent: false, notifyParent: false });
          } else {
            this.push(itemValue, { emitEvent: false, notifyParent: false });
          }
        });
    }

    if (!itemsValue || this._items.length > itemsValue.length) {
      const firstIndex = itemsValue ? itemsValue.length : 0;
      const itemLength = this._items.length;
      for (let i = firstIndex; i < itemLength; i++) {
        this.remove(firstIndex, { emitEvent: false, notifyParent: false });
      }
    }

    if (itemsValue) {
      this._items.setValue(itemsValue, { emitEvent: emitEvent });
    }

    this.checkOptions(options);
  }

  override update(): void {
    const options = { emitEvent: false };

    if (this.showLog) {
      console.log('[Group] Parent notified');
    }

    const itemsValue =
      this.supervisors.map((supervisor) => supervisor.value);

    this._items.setValue(itemsValue, options);

    this.checkOptions(options);
  }

  move(oldIndex: number, newIndex: number) {
    console.log('@TODO', oldIndex, '=>', newIndex);
  }

  override patchValue(itemsValue: DATA_TYPE[], options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    if (this.showLog) {
      console.log('[Array] Patch value', itemsValue)
    }

    if (itemsValue) {
      itemsValue.forEach(
        (itemValue, index) => {
          if (index < this._items.length) {
            this.at(index).patchValue(itemValue, { emitEvent: false, notifyParent: false });
          } else {
            this.push(itemValue, { emitEvent: false, notifyParent: false });
          }
        });
    }

    if (itemsValue) {
      this._items.patchValue(itemsValue, { emitEvent });
    }

    this.checkOptions(options);
  }

  reset(options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    this._items.reset({ emitEvent });

    this.checkOptions(options);
  }

  clear(options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    this._items.clear({ emitEvent });

    this.checkOptions(options);
  }

  at(index: number): SUPERVISOR_TYPE {
    const supervisor = this.supervisors.at(index);

    if (!supervisor) {
      throw new Error(`Unknown supervisor index "${ index }"`);
    }

    return supervisor;
  }

  push(itemValue: DATA_TYPE, options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    const item =
      SupervisorHelper.factoryItem<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>(
        this.itemType,
        itemValue
      );

    if (this.showLog) {
      console.log('[Array] Add item', item, item.value)
    }

    this._items.push(item, { emitEvent });

    this.checkOptions(options);
  }

  insert(itemValue: DATA_TYPE, index: number, options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    const item =
      SupervisorHelper.factoryItem<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>(
        this.itemType,
        itemValue
      );

    this._items.insert(item, index, { emitEvent });

    this.checkOptions(options);
  }

  remove(index: number, options?: FormOptions) {
    if (this.showLog) {
      console.log('[Array] Remove item', index)
    }

    const emitEvent = options?.emitEvent ?? true;

    this._items.removeAt(index, { emitEvent });

    this.checkOptions(options);
  }

  splice(start: number, deleteCount?: number, options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    Array.from({
        length: deleteCount ?? this._items.length - start
      },
      (_, i) =>
        this._items.removeAt(start + i, { emitEvent: emitEvent })
    );

    this.checkOptions(options);
  }

  override updateInitialValue(value: DATA_TYPE[]) {
    this.supervisors.forEach((supervisor, index) =>
      supervisor.updateInitialValue(value[index])
    );

    super.updateInitialValue(value);
  }

  override resetInitialValue() {
    this.supervisors.forEach((supervisor) =>
      supervisor.resetInitialValue()
    );

    super.resetInitialValue();
  }

  override restore(options?: FormOptions) {
    this.supervisors.forEach((supervisor) =>
      supervisor.restore({ emitEvent: false, notifyParent: false })
    );

    super.restore(options);

    this.checkOptions(options);
  }

  override enableLog() {
    super.enableLog();
    this.supervisors.forEach((supervisor) =>
      supervisor.enableLog());
  }

  override disableLog() {
    super.disableLog();
    this.supervisors.forEach((supervisor) =>
      supervisor.disableLog());
  }

  override getChanges(): FormChange[] {
    return this.supervisors.map((_, index) =>
      this.compareEngine.getRightState(index)
    ) as FormChange[]
  }

  override onChange(itemsValue: DATA_TYPE[] | undefined = this.value) {
    super.onChange(itemsValue);
    this.supervisors = [];

    if (itemsValue) {
      if (!TypeHelper.isObject(itemsValue) && TypeHelper.isArray<DATA_TYPE>(itemsValue)) {

        itemsValue.forEach((itemValue, index) => {

          if (this._items.controls[index] === undefined) {
            this.push(itemValue);
          }

          const control =
            this._items.controls[index] as GetFormArrayGenericClass<FORM_TYPE>;

          const supervisor =
            SupervisorHelper.factory<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>, SUPERVISOR_TYPE>(
              control,
              this,
              this.determineArrayIndexFn,
              this.itemType,
              this.showLog
            )

          if (TypeHelper.isEvaluable(this.compareEngine.leftValue)
            && TypeHelper.isArray(this.compareEngine.leftValue)) {

            if (index >= this.compareEngine.leftValue.length) {
              supervisor.resetInitialValue();
            } else {
              supervisor.updateInitialValue(
                this.compareEngine.leftValue.at(index) as DATA_TYPE
              );
            }
          }

          this.supervisors.push(supervisor);
        })
      }
    }
  }
}

export class FormArrayControlSupervisor<
  DATA_TYPE
> extends FormArraySupervisor<
  DATA_TYPE,
  FormArray<FormControl<DATA_TYPE | null>>
> {
  constructor(
    items: FormArray<FormControl<DATA_TYPE | null>>,
    determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
    itemType?: FormArrayItemConfigurationType<DATA_TYPE, FormControl<DATA_TYPE | null>>,
    parentSupervisor?: FormSupervisor,
    showLog = false
  ) {
    super(items, determineArrayIndexFn, itemType, parentSupervisor, showLog);
  }
}

export class FormArrayGroupSupervisor<
  DATA_TYPE,
  FORM_TYPE extends FormArray,
> extends FormArraySupervisor<
  DATA_TYPE,
  FORM_TYPE
> {
  constructor(
    items: FORM_TYPE,
    values: DATA_TYPE[],
    determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
    itemType?: FormArrayItemConfigurationType<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>,
    parentSupervisor?: FormSupervisor,
    showLog = false
  ) {
    super(items, determineArrayIndexFn, itemType, parentSupervisor, showLog);
  }
}
