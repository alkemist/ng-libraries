# Form Supervisor

## Installation

* From npm: `npm install @alkemist/ng-form-supervisor`
* From yarn: `yarn add @alkemist/ng-form-supervisor`

## Test

* From npm: `npm test`
* From yarn: `yarn test`

## About

Adds new functionality to Angular forms (FormGroup, FormArray, FormControl):

- A modification state between initial value and form value, using comparison
  engine ([@alkemist/compare-engine](https://github.com/alkemist/compare-engine))
- The ability to restore to original value, but also to modify initial value
- Even if you decide not to emit an event (emitEvent : false), parents and children are warned of the value change
- The ability to add an element to a FormArray only with a value, the only constraint being that when the FormArray is
  initialized, it must contain at least one element, to determine its "construction signature" (the type of element it
  contains, see example)  
  The configuration is saved (in case the array is emptied) and passed on to the children.

Supervisors will recursively build the supervisors of the form's child elements (see example).

## Examples

    import {FormGroupSupervisor} from '@alkemist/ng-form-supervisor';

    type USER_GROUP = "USER" | "ADMIN" | "SUPERADMIN";

    interface ComplexeUser extends BasicUser {
        groups: USER_GROUP[],
        profiles: {
            username: string,
            avatar: string | null,
            badges: string[],
        }[]
        rights: {
            viewProfile: boolean,
            viewUsers: boolean
        }
    }

    const formGroup =
        new FormGroup({
            id: new FormControl<number | null>("id"),
            name: new FormControl<string | null>("name", [
                Validators.required,
                Validators.minLength(3),
            ]),
            groups: new FormArray([
                new FormControl<USER_GROUP>("USER")
            ], [Validators.required]),

            profiles: new FormArray([
                new FormGroup({
                    username: new FormControl<string>("username"),
                    avatar: new FormControl<string | null>(null),
                    badges: new FormArray([
                        new FormControl<string | null>("badge")
                    ]),
                })
            ], [Validators.required]),

            rights: new FormGroup({
                viewProfile: new FormControl<boolean | null>(true),
                viewUsers: new FormControl<boolean | null>(false),
            }),
        });


    // The "group.value" parameter permits "form self-determination"
    const supervisor =
            new FormGroupSupervisor(group, group.value as ComplexeUser);

    // Each child of the form has its own supervisor
    // who manages its state of comparison between the initial value and the value of the form.

    supervisor.get("name")                                // return a FormControlSupervisor
    supervisor.get("groups")                              // return a FormArrayControlSupervisor
    supervisor.get("groups").at(0)                        // return a FormControlSupervisor
    supervisor.get("profiles")                            // return a FormArrayGroupSupervisor
    supervisor.get("profiles").at(0)                      // return a FormGroupSupervisor
    supervisor.get("profiles").at(0).get('username')      // return a FormControlSupervisor
    supervisor.get("profiles").at(0).get('badges')        // return a FormArrayControlSupervisor
    supervisor.get("profiles").at(0).get('badges').at(0)  // return a FormControlSupervisor
    supervisor.get("rights")                              // return a FormGroupSupervisor
    supervisor.get("rights").get("viewProfile")           // return a FormControlSupervisor

    # For add a array item
    supervisor.get("profiles").push({username: "", avatar: null, badges: []})

    # instead of
    (formGroup.get("profiles") as FormArray).push(new FormGroup({
            username: new FormControl<string>("", [Validators.required]),
            avatar: new FormControl<string | null>(null),
            badges: new FormArray([]),
        }));

    # State can be recovered in this way:
    supervisor.hasChange()                                // return true
    supervisor.get("profiles").hasChange()                // return true
    supervisor.get("profiles").at(0).hasChange()          // return false
    supervisor.get("profiles").at(1).hasChange()          // return false
    supervisor.get("rights").hasChange()                  // return false

    supervisor.getChanges()                               
    /* return 
        {
            id:         CompareState.EQUAL,
            name:       CompareState.EQUAL,
            groups:     CompareState.EQUAL,
            profiles:   CompareState.UPDATED,
            rights:     CompareState.EQUAL
        }
    */

    supervisor.get("profiles").getChanges()                               
    /* return 
        [
          CompareState.EQUAL,
          CompareState.ADDED,
        ]
    */

    supervisor.get("profiles").setValue([])
    supervisor.get("profiles").getInitialChanges(0)    // return CompareState.REMOVED

    supervisor.resetInitialValue()                                
    supervisor.hasChange()                             // return false

## Exposed models, enums and utils

    abstract class FormSupervisor<
        DATA_TYPE = any,
        FORM_TYPE extends AbstractControl = AbstractControl
    > {
        get form(): FORM_TYPE
    
        get valid(): boolean
    
        get value(): FormDataType<DATA_TYPE, FORM_TYPE> | undefined
    
        get valueChanges(): Observable<FormDataType<DATA_TYPE, FORM_TYPE>>
    
        setValue(value: FormRawDataType<DATA_TYPE, FORM_TYPE> | undefined, options?: FormOptions): void
        
        getChanges(path: ValueKey | ValueKey[] = ''): CompareState | GenericValueRecord<FormChange> | FormChange[]

        getInitialChanges(path: ValueKey | ValueKey[] = ''): CompareState | GenericValueRecord<FormChange> | FormChange[]

        reset(options?: FormOptions): void

        updateInitialValue(value?: FormRawDataType<DATA_TYPE, FORM_TYPE>)

        resetInitialValue(): void

        hasChange(): boolean

        restore(options?: FormOptions)
    }

    class FormGroupSupervisor<
        DATA_TYPE,
        FORM_GROUP_TYPE extends FormGroup,
    >
        extends FormSupervisor<
            DATA_TYPE,
            FORM_GROUP_TYPE
        > {
            constructor(
                group: FORM_GROUP_TYPE,
                data: DATA_TYPE,
                determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
            )
    }

    abstract class FormArraySupervisor<
        DATA_TYPE,
        FORM_TYPE extends FormArray,
        SUPERVISOR_TYPE extends FormSupervisor<DATA_TYPE> =
            GetFormArrayGenericClass<FORM_TYPE> extends FormGroup
                ? FormGroupSupervisor<DATA_TYPE, GetFormArrayGenericClass<FORM_TYPE>>
                : FormControlSupervisor<DATA_TYPE>,
    > 
        extends FormSupervisor<
            DATA_TYPE[],
            FORM_TYPE
        > {
            patchValue(value: DATA_TYPE[], options?: FormOptions)

            clear(options?: FormOptions)

            at(index: number): SUPERVISOR_TYPE

            push(itemValue: DATA_TYPE, options?: FormOptions)

            insert(itemValue: DATA_TYPE, index: number, options?: FormOptions)

            remove(index: number)

            splice(start: number, deleteCount?: number)
    }

    class FormArrayControlSupervisor<DATA_TYPE> 
        extends FormArraySupervisor<
            DATA_TYPE,
            FormArray<FormControl<DATA_TYPE | null>>
        > {
            constructor(
                items: FormArray<FormControl<DATA_TYPE | null>>,
                determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
            )
    }


    class FormArrayGroupSupervisor<DATA_TYPE, FORM_TYPE extends FormArray> 
        extends FormArraySupervisor<
            DATA_TYPE,
            FormArray<FormControl<DATA_TYPE | null>>
        > {
            constructor(
                items: FORM_TYPE,
                values: DATA_TYPE[],
                determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
            )
    }

    export class FormGroupSupervisor<
        DATA_TYPE,
        FORM_GROUP_TYPE extends FormGroup,
    >
        extends FormSupervisor<
            DATA_TYPE,
            FORM_GROUP_TYPE
        > {
            constructor(
                protected group: FORM_GROUP_TYPE,
                data: DATA_TYPE,
                determineArrayIndexFn: ((paths: ValueKey[]) => ValueKey) | undefined = undefined,
            )

            patchValue(value: PartialGroupValueType<GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>, DATA_TYPE>, options?: FormOptions)

            clear(options?: FormOptions)

            get<K extends keyof DATA_TYPE>(property: K)
                : SupervisorType<DATA_TYPE[K], GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K]>
        
            getFormProperty<K extends keyof DATA_TYPE>(property: K)
                : GetFormGroupGenericClass<FORM_GROUP_TYPE, DATA_TYPE>[K]
    }

## License

[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
