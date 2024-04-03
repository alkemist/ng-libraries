import { describe, expect, it } from "@jest/globals";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BasicUser } from "./test-data";
import {
  FormArrayControlSupervisor,
  FormArrayGroupSupervisor,
  FormControlSupervisor,
  FormGroupSupervisor
} from "../src/lib";

describe("FormArraySupervisor", () => {
  describe("Users group array", () => {
    const array = new FormArray([
      new FormGroup({
        id: new FormControl<number | null>(1),
        name: new FormControl<string>("user 1", [ Validators.required ]),
      })
    ]);

    const supervisor
      = new FormArrayGroupSupervisor(array, array.value as {
      id: number | null,
      name: string
    }[], undefined, undefined);

    testFormArray(array, supervisor, {
      initialValidItem: { id: 1, name: "user 1" },
      invalidItem: { id: null, name: "" },
      newInvalidElement: new FormGroup<{
        id: FormControl<number | null>,
        name: FormControl<string | null>,
      }>({
        id: new FormControl<number | null>(null),
        name: new FormControl<string>("", [ Validators.required ]),
      }),
      newValidItem: { id: 2, name: "user 2" },
      invalidFirstItem: { id: 1, name: "" },
      resetValue: { id: null, name: null },
      newArray: [ { id: 3, name: "user3" }, { id: 4, name: "user4" }, { id: 5, name: "user5" } ],
    });

    expect(supervisor.at(0)).toBeInstanceOf(FormGroupSupervisor);
    expect(supervisor.at(0).get('id')).toBeInstanceOf(FormControlSupervisor);
  });

  describe("Numbers control array", () => {
    const array = new FormArray([
      new FormControl(5, [ Validators.required ])
    ])

    const supervisor
      = new FormArrayControlSupervisor<number>(array);

    testFormArray<number | null, FormArray<FormControl>, FormControl>(array, supervisor, {
      initialValidItem: 5,
      invalidItem: null,
      newInvalidElement: new FormControl<number | null>(null, [ Validators.required ]),
      newValidItem: 99,
      invalidFirstItem: null,
      resetValue: null,
      newArray: [ 10, 20, 30 ],
    });
  });

  describe("User control array", () => {
    const array = new FormArray([
      new FormControl<BasicUser>({ id: 1, name: "user 1" }, [ Validators.required ])
    ])

    const supervisor
      = new FormArrayControlSupervisor<BasicUser>(array);

    testFormArray<BasicUser | null, FormArray<FormControl>, FormControl>(array, supervisor, {
      initialValidItem: { id: 1, name: "user 1" },
      invalidItem: null,
      newInvalidElement: new FormControl<BasicUser | null>(null, [ Validators.required ]),
      newValidItem: { id: 2, name: "user 2" },
      invalidFirstItem: null,
      resetValue: null,
      newArray: [ { id: 3, name: "user3" }, { id: 4, name: "user4" }, { id: 5, name: "user5" } ],
    });
  });
});

interface FormArrayTestData<
  DATA_TYPE,
  FORM_TYPE extends FormControl | FormGroup
> {
  initialValidItem: DATA_TYPE,
  invalidItem: DATA_TYPE,
  newInvalidElement: FORM_TYPE,
  newValidItem: DATA_TYPE,
  invalidFirstItem: DATA_TYPE,
  resetValue: any,
  newArray: DATA_TYPE[],
}

function testFormArray<
  DATA_TYPE,
  FORM_TYPE extends FormArray<FORM_ARRAY_ITEM_TYPE>,
  FORM_ARRAY_ITEM_TYPE extends FormControl | FormGroup
>(
  array: FORM_TYPE,
  supervisor: FormArrayGroupSupervisor<DATA_TYPE, FORM_TYPE> | FormArrayControlSupervisor<DATA_TYPE>,
  testData: FormArrayTestData<DATA_TYPE, FORM_ARRAY_ITEM_TYPE>,
) {
  it('should have correct initial value', () => {
    expect(supervisor.value).toEqual([ testData.initialValidItem ]);
    expect(supervisor.hasChange()).toBe(false);
    expect(supervisor.valid).toBe(true);
    expect(supervisor.at(0).value).toEqual(testData.initialValidItem);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(supervisor.at(0).valid).toBe(true);
  })

  it('update  with invalid item', () => {
    array.at(0).setValue(testData.invalidItem);

    expect(supervisor.value).toEqual([ testData.invalidItem ]);
    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.valid).toBe(false);
    expect(supervisor.at(0).value).toEqual(testData.invalidItem);
    expect(supervisor.at(0).hasChange()).toBe(true);
    expect(supervisor.at(0).valid).toBe(false);
  });

  it('restore 1', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(array.value).toEqual([ testData.initialValidItem ]);
    expect(array.valid).toBe(true);
    expect(array.at(0).value).toEqual(testData.initialValidItem);
    expect(array.at(0).valid).toBe(true);
  });

  it('add new invalid element', () => {
    array.push(testData.newInvalidElement);

    expect(supervisor.value).toEqual([
      testData.initialValidItem,
      testData.invalidItem
    ]);
    expect(supervisor.length).toBe(2);
    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(supervisor.valid).toBe(false);
  });

  it('add new invalid item', () => {
    supervisor.push(testData.invalidItem);

    expect(array.length).toBe(3);
    expect(array.value).toEqual([
      testData.initialValidItem,
      testData.invalidItem,
      testData.invalidItem
    ]);
    expect(array.at(0).valid).toBe(true);
    expect(array.at(1).valid).toBe(false);
    expect(array.at(2).valid).toBe(false);
    expect(array.valid).toBe(false);
  });

  it('remove item 0', () => {
    supervisor.remove(0);

    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.at(0).hasChange()).toBe(true);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(array.value).toEqual([
      testData.invalidItem,
      testData.invalidItem
    ]);
    expect(array.length).toBe(2);
    expect(array.valid).toBe(false);
  });

  it('restore 2', () => {
    supervisor.at(0).restore();

    expect(array.value).toEqual([
      testData.initialValidItem,
      testData.invalidItem,
    ]);
    expect(array.at(0).valid).toBe(true);
    expect(array.at(1).valid).toBe(false);
    expect(array.valid).toBe(false);
  });

  it('splice 0', () => {
    supervisor.splice(0, 1);

    expect(array.value).toEqual([
      testData.invalidItem,
    ]);
    expect(array.at(0).valid).toBe(false);
    expect(array.valid).toBe(false);
  });

  it('reset', () => {
    supervisor.reset();

    expect(array.value).toEqual([ testData.resetValue ]);
    expect(array.at(0).valid).toBe(false);
    expect(array.valid).toBe(false);
  });

  it('clear', () => {
    supervisor.clear();

    expect(array.value).toEqual([]);
    expect(array.valid).toBe(true);
  });

  it('restore 3', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(supervisor.at(0).value).toEqual(testData.initialValidItem);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(supervisor.at(0).valid).toBe(true);
    expect(array.value).toEqual([ testData.initialValidItem, ]);
    expect(array.valid).toBe(true);
  });

  it('set with 2 invalid item', () => {
    supervisor.setValue([
      testData.newValidItem,
      testData.newValidItem,
    ]);

    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.at(0).hasChange()).toBe(true);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(array.value).toEqual([
      testData.newValidItem,
      testData.newValidItem,
    ]);
    expect(array.valid).toBe(true);
  });

  it('patch', () => {
    supervisor.patchValue([
      testData.initialValidItem,
    ]);

    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(array.value).toEqual([
      testData.initialValidItem,
      testData.newValidItem,
    ]);
    expect(array.valid).toBe(true);
  });

  it('update initial value', () => {
    supervisor.resetInitialValue();

    expect(supervisor.hasChange()).toBe(false);
    expect(array.length).toBe(2);
  });

  it('set with array', () => {
    supervisor.setValue(testData.newArray);

    expect(supervisor.hasChange()).toBe(true);
    expect(array.length).toBe(3);
  });

  it('restore 4', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(array.length).toBe(2);
  });

  it('set with empty array', () => {
    supervisor.setValue([]);

    expect(supervisor.hasChange()).toBe(true);
    expect(array.length).toBe(0);
  });

  it('restore, set and push', () => {
    supervisor.restore();

    supervisor.at(0).setValue(testData.invalidFirstItem as never);
    supervisor.push(testData.invalidItem);

    expect(supervisor.hasChange()).toBe(true);
    expect(supervisor.at(0).hasChange()).toBe(true);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(array.valid).toBe(false);
    expect(array.at(0).valid).toBe(false);
    expect(array.at(0).value).toEqual(testData.invalidFirstItem);
    expect(array.length).toBe(3);
  });

  it('restore 7', () => {
    supervisor.restore();

    expect(supervisor.hasChange()).toBe(false);
    expect(supervisor.at(0).hasChange()).toBe(false);
    expect(supervisor.at(1).hasChange()).toBe(false);
    expect(array.value).toEqual([
      testData.initialValidItem,
      testData.newValidItem,
    ]);
    expect(array.valid).toBe(true);
  });
}
