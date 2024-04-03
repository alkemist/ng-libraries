import { describe, expect, it } from "@jest/globals";
import { FormControl, Validators } from "@angular/forms";
import { BasicUser } from "./test-data";
import { FormControlSupervisor } from "../src/lib";

describe("FormControlSupervisor", () => {
  describe("Basic", () => {
    const control =
      new FormControl<string>("init", [ Validators.required ]);

    const supervisor =
      new FormControlSupervisor(control);

    testFormControl<string | null>(control, supervisor, {
      initialValue: "init",
      invalidValue: "",
      newValue: "new value"
    })
  })

  describe("Object", () => {
    const control =
      new FormControl<BasicUser>({ id: 1, name: "user 1" }, [ Validators.required ]);

    const supervisor =
      new FormControlSupervisor(control);

    testFormControl<BasicUser | null>(control, supervisor, {
      initialValue: { id: 1, name: "user 1" },
      invalidValue: null,
      newValue: { id: 1, name: "user 1 bis" }
    })
  });
});

interface FormControlTestData<
  DATA_TYPE
> {
  initialValue: DATA_TYPE,
  invalidValue: DATA_TYPE,
  newValue: DATA_TYPE,
}

function testFormControl<DATA_TYPE>(
  control: FormControl<DATA_TYPE>,
  supervisor: FormControlSupervisor<DATA_TYPE>,
  testData: FormControlTestData<DATA_TYPE>
) {
  it('should initial value', () => {
    expect(supervisor.value).toEqual(testData.initialValue);
    expect(supervisor.hasChange()).toBe(false);
    expect(supervisor.valid).toBe(true);
  });

  it('should set invalid value', () => {
    control.setValue(testData.invalidValue);

    expect(supervisor.value).toEqual(testData.invalidValue);
    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.valid).toBe(false);
  });

  it('should restore 1', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(control.value).toEqual(testData.initialValue);
    expect(control.valid).toBe(true);
  });

  it('should set new value', () => {
    control.setValue(testData.newValue);

    expect(supervisor.value).toEqual(testData.newValue);
    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.valid).toBe(true);
  });

  it('should update initial value', () => {
    supervisor.resetInitialValue();

    expect(supervisor.hasChange()).toBe(false);
  });

  it('should reset', () => {
    control.reset();

    expect(supervisor.hasChange()).toBe(true);
    expect(control.value).toBe(null);
    expect(control.valid).toBe(false);
  });

  it('should restore 2', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(control.value).toEqual(testData.newValue);
    expect(control.valid).toBe(true);
  });
}
