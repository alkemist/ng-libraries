import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { ValueKey } from "@alkemist/smart-tools";
import { FormSupervisor } from "./form-supervisor";
import { FormOptions } from "./form.interface";

export class FormControlSupervisor<DATA_TYPE>
  extends FormSupervisor<
    DATA_TYPE,
    FormControl<DATA_TYPE>
  > {
  constructor(
    protected control: FormControl<DATA_TYPE>,
    determineArrayIndexFn?: ((paths: ValueKey[]) => ValueKey),
    parentSupervisor?: FormSupervisor,
    showLog = false
  ) {
    super(determineArrayIndexFn, parentSupervisor);
    this.showLog = showLog;

    this.resetInitialValue();

    this.sub.add(this.control.valueChanges.subscribe((value) => {
      if (this.showLog) {
        console.log('[Control] Change detected', value)
      }

      this.onChange(value)
    }));
  }

  get form(): FormControl<DATA_TYPE> {
    return this.control;
  }

  get valid(): boolean {
    return this.control.valid;
  }

  get value(): DATA_TYPE {
    return this.control.value;
  }

  get valueChanges(): Observable<DATA_TYPE> {
    return this.control.valueChanges;
  }

  setValue(value: DATA_TYPE, options?: FormOptions, notifyParent = true) {
    const emitEvent = options?.emitEvent ?? true;

    if (this.showLog) {
      console.log('[Control] Set value', value)
    }

    this.form.setValue(value, { emitEvent });

    this.checkOptions(options);
  }

  reset(options?: FormOptions) {
    const emitEvent = options?.emitEvent ?? true;

    this.control.reset(undefined, { emitEvent });

    this.checkOptions(options);
  }
}
