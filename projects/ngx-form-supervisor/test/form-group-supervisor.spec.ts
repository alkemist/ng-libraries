import {
  FormArrayControlSupervisor,
  FormArrayGroupSupervisor,
  FormControlSupervisor,
  FormGroupSupervisor,
  GenericFormDataValueType
} from "../src/lib";
import { ComplexeUser, USER_GROUP, UserProfile, UserRights } from "./test-data";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { CompareState } from "@alkemist/compare-engine";


describe("FormGroupSupervisor", () => {
  const initialValue: ComplexeUser = {
    id: 1,
    name: "user 1",
    groups: [ "USER" ],
    profiles: [
      {
        username: "username1",
        avatar: null,
        badges: [ 'first' ],
      }
    ],
    rights: {
      viewProfile: true,
      viewUsers: false
    }
  }

  const invalidValue: ComplexeUser = {
    ...initialValue,
    name: "us",
    groups: [],
    profiles: [
      initialValue.profiles[0],
      {
        username: "",
        avatar: "",
        badges: [],
      }
    ],
    rights: {
      ...initialValue.rights,
      viewProfile: false,
    }
  }

  const newValue: ComplexeUser = {
    ...initialValue,
    name: "admin",
    groups: [ 'SUPERADMIN' ],
    profiles: [
      {
        username: "username1-bis",
        avatar: null,
        badges: [ "second" ],
      },
      {
        username: "username2",
        avatar: null,
        badges: [],
      }
    ],
    rights: {
      viewProfile: true,
      viewUsers: true
    }
  }

  const newValueBis: ComplexeUser = {
    ...newValue,
    profiles: [
      newValue.profiles[0],
      {
        ...newValue.profiles[1],
        badges: [ "new" ],
      }
    ],
  }


  describe("Changes", () => {
    const group =
      new FormGroup({
        id: new FormControl<number | null>(initialValue.id),
        name: new FormControl<string | null>(initialValue.name, [
          Validators.required,
          Validators.minLength(3),
        ]),
        groups: new FormArray([
          new FormControl<USER_GROUP>(initialValue.groups[0])
        ], [ Validators.required ]),

        profiles: new FormArray([
          new FormGroup({
            username: new FormControl<string>(initialValue.profiles[0].username, [ Validators.required ]),
            avatar: new FormControl<string | null>(initialValue.profiles[0].avatar),
            badges: new FormArray([
              new FormControl<string | null>(initialValue.profiles[0].badges[0])
            ]),
          })
        ], [ Validators.required ]),

        rights: new FormGroup({
          viewProfile: new FormControl<boolean | null>(initialValue.rights.viewProfile),
          viewUsers: new FormControl<boolean | null>(initialValue.rights.viewUsers),
        }),
      });

    const supervisor =
      new FormGroupSupervisor(group, group.value as ComplexeUser);

    it("initial value", () => {
      expect(supervisor.value).toEqual(initialValue);
      expect(supervisor.hasChange()).toBe(false);
      expect(supervisor.valid).toBe(true);
    })

    it('should have correct supervisor instance', () => {
      expect(supervisor.get("name")).toBeInstanceOf(FormControlSupervisor);
      expect(supervisor.get("groups")).toBeInstanceOf(FormArrayControlSupervisor);
      expect(supervisor.get("groups").at(0)).toBeInstanceOf(FormControlSupervisor);
      expect(supervisor.get("profiles")).toBeInstanceOf(FormArrayGroupSupervisor);
      expect(supervisor.get("profiles").at(0)).toBeInstanceOf(FormGroupSupervisor);
      expect(supervisor.get("profiles").at(0).get('username')).toBeInstanceOf(FormControlSupervisor);
      expect(supervisor.get("profiles").at(0).get('badges')).toBeInstanceOf(FormArrayControlSupervisor);
      expect(supervisor.get("profiles").at(0).get('badges').at(0)).toBeInstanceOf(FormControlSupervisor);
      expect(supervisor.get("rights")).toBeInstanceOf(FormGroupSupervisor);
      expect(supervisor.get("rights").get("viewProfile")).toBeInstanceOf(FormControlSupervisor);
    })

    it('should have correct control instance', () => {
      expect(supervisor.getFormProperty("name")).toBeInstanceOf(FormControl);
      expect(supervisor.getFormProperty("groups")).toBeInstanceOf(FormArray);
      expect(supervisor.getFormProperty("groups").at(0)).toBeInstanceOf(FormControl);
      expect(supervisor.getFormProperty("profiles")).toBeInstanceOf(FormArray);
      expect(supervisor.getFormProperty("profiles").at(0)).toBeInstanceOf(FormGroup);
      expect(supervisor.getFormProperty("profiles").at(0).get('username')).toBeInstanceOf(FormControl);
      expect(supervisor.getFormProperty("profiles").at(0).get('badges')).toBeInstanceOf(FormArray);
      expect((supervisor.getFormProperty("profiles").at(0).get('badges') as FormArray).at(0)).toBeInstanceOf(FormControl);
      expect(supervisor.getFormProperty("rights")).toBeInstanceOf(FormGroup);
      expect(supervisor.getFormProperty("rights").get('viewProfile')).toBeInstanceOf(FormControl);
    });


    it('should update 1', () => {
      (group.get("groups") as FormArray)?.removeAt(0);
      group.get("rights")?.get("viewProfile")?.setValue(invalidValue.rights.viewProfile);

      (group.get("profiles") as FormArray).push(new FormGroup({
        username: new FormControl<string>("", [ Validators.required ]),
        avatar: new FormControl<string | null>(invalidValue.profiles[1].avatar),
        badges: new FormArray([]),
      }));

      supervisor.patchValue({
        name: invalidValue.name,
        profiles: [
          invalidValue.profiles[0],
          {
            username: invalidValue.profiles[1].username
          }
        ]
      });

      expect(supervisor.value).toEqual({
        ...initialValue,
        ...invalidValue,
      });
      expect(supervisor.hasChange()).toBe(true);
      expect(supervisor.getChanges()).toEqual({
        id: CompareState.EQUAL,
        name: CompareState.UPDATED,
        groups: CompareState.UPDATED,
        profiles: CompareState.UPDATED,
        rights: CompareState.UPDATED,
      });
      expect(supervisor.valid).toBe(false);
      expect(supervisor.get("id").value).toBe(invalidValue.id);
      expect(supervisor.get("id").hasChange()).toBe(false);
      expect(supervisor.get("id").valid).toBe(true);
      expect(supervisor.get("name").value).toBe(invalidValue.name);
      expect(supervisor.get("name").hasChange()).toBe(true);
      expect(supervisor.get("name").valid).toBe(false);
      expect(supervisor.get("groups").value).toEqual(invalidValue.groups);
      expect(supervisor.get("groups").hasChange()).toEqual(true);
      expect(supervisor.get("groups").getInitialChanges()).toEqual(CompareState.UPDATED);
      expect(supervisor.get("groups").getInitialChanges(0)).toEqual(CompareState.REMOVED);
      expect(supervisor.get("groups").valid).toBe(false);
      expect(supervisor.get("profiles").value).toEqual(invalidValue.profiles);
      expect(supervisor.get("profiles").hasChange()).toEqual(true);
      expect(supervisor.get("profiles").valid).toBe(false);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get("rights").value).toEqual(invalidValue.rights);
      expect(supervisor.get("rights").hasChange()).toEqual(true);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(true);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(false);
      expect(supervisor.get("rights").valid).toBe(true);
    });

    it('should restore 1', () => {
      supervisor.restore();

      expect(supervisor.hasChange()).toBe(false);
      expect(supervisor.get("id").hasChange()).toBe(false);
      expect(supervisor.get("name").hasChange()).toBe(false);
      expect(supervisor.get('groups').hasChange()).toBe(false);
      expect(supervisor.get('groups').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get("rights").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(false);
      expect(group.value).toEqual(initialValue);
      expect(group.valid).toBe(true);
      expect(group.get("id")?.value).toBe(initialValue.id);
      expect(group.get("name")?.value).toBe(initialValue.name);
      expect(group.get("groups")?.value).toEqual(initialValue.groups);
      expect(group.get("profiles")?.value).toEqual(initialValue.profiles);
      expect(group.get("rights")?.value).toEqual(initialValue.rights);
    });

    it('should update 2', () => {
      supervisor.get("name").setValue(newValue.name);
      supervisor.get('groups').remove(0);
      supervisor.get('groups').push("ADMIN");
      supervisor.get('groups').at(0).setValue(newValue.groups[0]);
      supervisor.get('profiles').at(0).get("username").setValue(newValue.profiles[0].username);
      supervisor.get('profiles').at(0).get("badges").setValue(newValue.profiles[0].badges);
      supervisor.get("profiles").push(newValue.profiles[1]);
      supervisor.get("profiles").at(1).get("badges").push(newValueBis.profiles[1].badges[0]);
      supervisor.get("rights").get("viewUsers").setValue(newValue.rights.viewUsers);

      expect(supervisor.hasChange()).toBe(true);
      expect(supervisor.getChanges()).toEqual({
        id: CompareState.EQUAL,
        name: CompareState.UPDATED,
        groups: CompareState.UPDATED,
        profiles: CompareState.UPDATED,
        rights: CompareState.UPDATED,
      });
      expect(supervisor.get("id").hasChange()).toBe(false);
      expect(supervisor.get("name").hasChange()).toBe(true);
      expect(supervisor.get('groups').hasChange()).toBe(true);
      expect(supervisor.get('groups').at(0).hasChange()).toBe(true);
      expect(supervisor.get('profiles').hasChange()).toBe(true);
      expect(supervisor.get('profiles').getInitialChanges()).toEqual(CompareState.UPDATED);
      expect(supervisor.get('profiles').getInitialChanges(0)).toEqual(CompareState.REMOVED);
      expect(supervisor.get('profiles').getChanges()).toEqual([
        CompareState.ADDED,
        CompareState.ADDED,
      ]);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).hasChange()).toBe(false);
      expect(supervisor.get("rights").hasChange()).toBe(true);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(true);
      expect(group.value).toEqual(newValueBis);
    });

    it('should update initial value', () => {
      supervisor.resetInitialValue();

      expect(supervisor.hasChange()).toBe(false);
      expect(supervisor.get("id").hasChange()).toBe(false);
      expect(supervisor.get("name").hasChange()).toBe(false);
      expect(supervisor.get('groups').hasChange()).toBe(false);
      expect(supervisor.get('groups').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get("rights").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(false);
    });

    it('should reset', () => {
      supervisor.reset();

      expect(supervisor.hasChange()).toBe(true);
      expect(supervisor.get("id").hasChange()).toBe(true);
      expect(supervisor.get("name").hasChange()).toBe(true);
      expect(supervisor.get('groups').hasChange()).toBe(true);
      expect(supervisor.get('groups').at(0).hasChange()).toBe(true);
      expect(supervisor.get('profiles').hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(1).get('username').hasChange()).toBe(true);
      expect(supervisor.get('profiles').at(1).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get("rights").hasChange()).toBe(true);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(true);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(true);
      expect(group.value).toEqual({
        id: null,
        name: null,
        groups: [ null ],
        profiles: [ {
          username: null,
          avatar: null,
          badges: [
            null
          ]
        }, {
          username: null,
          avatar: null,
          badges: [
            null
          ]
        } ],
        rights: {
          viewProfile: null,
          viewUsers: null,
        }
      });
      expect(group.valid).toBe(false);
    });


    it('should clear', () => {
      supervisor.clear();

      expect(group.value).toEqual({
        id: null,
        name: null,
        groups: [],
        profiles: [],
        rights: {
          viewProfile: null,
          viewUsers: null,
        }
      });
    });

    it('should restore 2', () => {
      supervisor.restore();

      expect(supervisor.hasChange()).toBe(false);
      expect(supervisor.get("id").hasChange()).toBe(false);
      expect(supervisor.get("name").hasChange()).toBe(false);
      expect(supervisor.get('groups').hasChange()).toBe(false);
      expect(supervisor.get('groups').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(0).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).get('username').hasChange()).toBe(false);
      expect(supervisor.get('profiles').at(1).get('avatar').hasChange()).toBe(false);
      expect(supervisor.get("rights").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewProfile").hasChange()).toBe(false);
      expect(supervisor.get("rights").get("viewUsers").hasChange()).toBe(false);
      expect(group.value).toEqual(newValueBis);
      expect(group.valid).toBe(true);
    });
  })

  describe("Events", () => {
    const group =
      new FormGroup({
        id: new FormControl<number | null>(initialValue.id),
        name: new FormControl<string | null>(initialValue.name, [
          Validators.required,
          Validators.minLength(3),
        ]),
        groups: new FormArray([
          new FormControl<USER_GROUP>(initialValue.groups[0])
        ], [ Validators.required ]),

        profiles: new FormArray([
          new FormGroup({
            username: new FormControl<string>(initialValue.profiles[0].username, [ Validators.required ]),
            avatar: new FormControl<string | null>(initialValue.profiles[0].avatar),
            badges: new FormArray([
              new FormControl<string | null>(initialValue.profiles[0].badges[0])
            ]),
          })
        ], [ Validators.required ]),

        rights: new FormGroup({
          viewProfile: new FormControl<boolean | null>(initialValue.rights.viewProfile),
          viewUsers: new FormControl<boolean | null>(initialValue.rights.viewUsers),
        }),
      });

    const supervisor =
      new FormGroupSupervisor(group, group.value as ComplexeUser);

    let onChangeSpy: jest.SpyInstance,
      nameSetValueSpy: jest.SpyInstance,
      nameOnChangeSpy: jest.SpyInstance,
      groupsSetValueSpy: jest.SpyInstance,
      groupsOnChangeSpy: jest.SpyInstance,
      group0SetValueSpy: jest.SpyInstance,
      group0OnChangeSpy: jest.SpyInstance,
      profilesSetValueSpy: jest.SpyInstance,
      profilesOnChangeSpy: jest.SpyInstance,
      profile0SetValueSpy: jest.SpyInstance,
      profile0OnChangeSpy: jest.SpyInstance,
      profile0UsernameSetValueSpy: jest.SpyInstance,
      profile0UsernameOnChangeSpy: jest.SpyInstance,
      rightsSetValueSpy: jest.SpyInstance,
      rightsOnChangeSpy: jest.SpyInstance,
      rightsViewUsersSetValueSpy: jest.SpyInstance,
      rightsViewUsersOnChangeSpy: jest.SpyInstance
    ;

    let userValue: GenericFormDataValueType<ComplexeUser> | null = null,
      userName: string | null = null,
      userGroups: USER_GROUP[] | null = null,
      userGroup0: USER_GROUP | null = null,
      userProfiles: UserProfile[] | null = null,
      userProfile0: GenericFormDataValueType<UserProfile> | null = null,
      userProfile0Username: string | null = null,
      userRights: GenericFormDataValueType<UserRights> | null = null,
      userRightsViewUsers: boolean | null = null
    ;


    supervisor.valueChanges.subscribe((value) => {
      userValue = value;
    });
    supervisor.get('name').valueChanges.subscribe((value) => {
      userName = value;
    });
    supervisor.get('groups').valueChanges.subscribe((value) => {
      userGroups = value;
    });
    supervisor.get('groups').at(0).valueChanges.subscribe((value) => {
      userGroup0 = value;
    });
    supervisor.get('profiles').valueChanges.subscribe((value) => {
      userProfiles = value;
    });
    supervisor.get('profiles').at(0).valueChanges.subscribe((value) => {
      userProfile0 = value;
    });
    supervisor.get('profiles').at(0).get('username').valueChanges.subscribe((value) => {
      userProfile0Username = value;
    });
    supervisor.get('rights').valueChanges.subscribe((value) => {
      userRights = value;
    });
    supervisor.get('rights').get('viewUsers').valueChanges.subscribe((value) => {
      userRightsViewUsers = value;
    });

    const reset = () => {
      supervisor.restore();

      onChangeSpy = jest.spyOn(supervisor, 'onChange');
      nameSetValueSpy = jest.spyOn(supervisor.get('name'), 'setValue');
      nameOnChangeSpy = jest.spyOn(supervisor.get('name'), 'onChange');
      groupsSetValueSpy = jest.spyOn(supervisor.get('groups'), 'setValue');
      groupsOnChangeSpy = jest.spyOn(supervisor.get('groups'), 'onChange');
      group0SetValueSpy = jest.spyOn(supervisor.get('groups').at(0), 'setValue');
      group0OnChangeSpy = jest.spyOn(supervisor.get('groups').at(0), 'onChange');
      profilesSetValueSpy = jest.spyOn(supervisor.get('profiles'), 'setValue');
      profilesOnChangeSpy = jest.spyOn(supervisor.get('profiles'), 'onChange');
      profile0SetValueSpy = jest.spyOn(supervisor.get('profiles').at(0), 'setValue');
      profile0OnChangeSpy = jest.spyOn(supervisor.get('profiles').at(0), 'onChange');
      profile0UsernameSetValueSpy = jest.spyOn(supervisor.get('profiles').at(0).get('username'), 'setValue');
      profile0UsernameOnChangeSpy = jest.spyOn(supervisor.get('profiles').at(0).get('username'), 'onChange');
      rightsSetValueSpy = jest.spyOn(supervisor.get('rights'), 'setValue');
      rightsOnChangeSpy = jest.spyOn(supervisor.get('rights'), 'onChange');
      rightsViewUsersSetValueSpy = jest.spyOn(supervisor.get('rights').get('viewUsers'), 'setValue');
      rightsViewUsersOnChangeSpy = jest.spyOn(supervisor.get('rights').get('viewUsers'), 'onChange');

      onChangeSpy.mockClear();
      nameSetValueSpy.mockClear();
      nameOnChangeSpy.mockClear();
      groupsSetValueSpy.mockClear();
      groupsOnChangeSpy.mockClear();
      group0SetValueSpy.mockClear();
      group0OnChangeSpy.mockClear();
      profilesSetValueSpy.mockClear();
      profilesOnChangeSpy.mockClear();
      profile0SetValueSpy.mockClear();
      profile0OnChangeSpy.mockClear();
      profile0UsernameSetValueSpy.mockClear();
      profile0UsernameOnChangeSpy.mockClear();
      rightsSetValueSpy.mockClear();
      rightsOnChangeSpy.mockClear();
      rightsViewUsersSetValueSpy.mockClear();
      rightsViewUsersOnChangeSpy.mockClear();

      userValue = null;
      userName = null;
      userGroups = null;
      userGroup0 = null;
      userProfiles = null;
      userProfile0 = null;
      userProfile0Username = null;
      userRights = null;
      userRightsViewUsers = null;
    };

    describe('should fire changes', () => {
      beforeAll(() => {
        reset();

        supervisor.setValue(newValue);
      })

      it('should fire form changes', () => {
        expect(onChangeSpy).toBeCalledWith(newValue);
        expect(onChangeSpy).toBeCalledTimes(1);
        expect(userValue).toEqual(newValue);
      })

      it('should fire name changes', () => {
        expect(nameSetValueSpy).toBeCalledWith(newValue.name, { "emitEvent": false, "notifyParent": false });
        expect(nameOnChangeSpy).toBeCalledWith(newValue.name);
        // First on Supervisors.forEach, second on FormGroup.setValue
        expect(nameOnChangeSpy).toBeCalledTimes(2);
        expect(userName).toEqual(newValue.name);
      });

      it('should fire groups changes', () => {
        expect(groupsSetValueSpy).toBeCalledWith(newValue.groups, { "emitEvent": false, "notifyParent": false });
        expect(groupsOnChangeSpy).toBeCalledWith(newValue.groups);
        expect(groupsOnChangeSpy).toBeCalledTimes(2);
        expect(userGroups).toEqual(newValue.groups);
      });

      it('should fire group 0 changes', () => {
        expect(group0SetValueSpy).toBeCalledWith(newValue.groups[0], {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(group0OnChangeSpy).toBeCalledWith(newValue.groups[0]);
        expect(group0OnChangeSpy).toBeCalledTimes(2);
        expect(userGroup0).toEqual(newValue.groups[0]);
      });

      it('should fire profiles changes', () => {
        expect(profilesSetValueSpy).toBeCalledWith(newValue.profiles, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profilesOnChangeSpy).toBeCalledWith(newValue.profiles);
        expect(profilesOnChangeSpy).toBeCalledTimes(3);
        expect(profilesOnChangeSpy).toHaveBeenNthCalledWith(1);
        expect(profilesOnChangeSpy).toHaveBeenNthCalledWith(2);
        expect(profilesOnChangeSpy).toHaveBeenNthCalledWith(3, newValue.profiles);
        expect(userProfiles).toEqual(newValue.profiles);
      });

      it('should fire profile 0 changes', () => {
        expect(profile0SetValueSpy).toBeCalledWith(newValue.profiles[0], {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profile0OnChangeSpy).toBeCalledWith(newValue.profiles[0]);
        expect(profile0OnChangeSpy).toBeCalledTimes(2);
        expect(userProfile0).toEqual(newValue.profiles[0]);
      });

      it('should fire profile 0 username changes', () => {
        expect(profile0UsernameSetValueSpy).toBeCalledWith(newValue.profiles[0].username, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profile0UsernameOnChangeSpy).toBeCalledWith(newValue.profiles[0].username);
        expect(profile0UsernameOnChangeSpy).toBeCalledTimes(2);
        expect(userProfile0Username).toEqual(newValue.profiles[0].username);
      });

      it('should fire rights changes', () => {
        expect(rightsSetValueSpy).toBeCalledWith(newValue.rights, { "emitEvent": false, "notifyParent": false });
        expect(rightsOnChangeSpy).toBeCalledWith(newValue.rights);
        expect(rightsOnChangeSpy).toBeCalledTimes(2);
        expect(userRights).toEqual(newValue.rights);
      });

      it('should fire rights view users changes', () => {
        expect(rightsViewUsersSetValueSpy).toBeCalledWith(newValue.rights.viewUsers, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(rightsViewUsersOnChangeSpy).toBeCalledWith(newValue.rights.viewUsers);
        expect(rightsViewUsersOnChangeSpy).toBeCalledTimes(2);
        expect(userRightsViewUsers).toEqual(newValue.rights.viewUsers);
      });
    });

    describe('should not fire changes', () => {
      beforeAll(() => {
        reset();

        supervisor.setValue(newValue, { emitEvent: false });
      })

      it('should not fire form changes', () => {
        expect(onChangeSpy).toBeCalledWith();
        expect(onChangeSpy).toBeCalledTimes(1);
        expect(userValue).toEqual(null)
      })

      it('should not fire name changes', () => {
        expect(nameSetValueSpy).toBeCalledWith(newValue.name, { "emitEvent": false, "notifyParent": false });
        expect(nameOnChangeSpy).toBeCalledWith();
        expect(nameOnChangeSpy).toBeCalledTimes(1);
        expect(userName).toEqual(null)
      });

      it('should not fire groups changes', () => {
        expect(groupsSetValueSpy).toBeCalledWith(newValue.groups, { "emitEvent": false, "notifyParent": false });
        expect(groupsOnChangeSpy).toBeCalledWith();
        expect(groupsOnChangeSpy).toBeCalledTimes(1);
        expect(userGroups).toEqual(null)
      });


      it('should not fire group 0 changes', () => {
        expect(group0SetValueSpy).toBeCalledWith(newValue.groups[0], {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(group0OnChangeSpy).toBeCalledWith();
        expect(group0OnChangeSpy).toBeCalledTimes(1);
        expect(userGroup0).toEqual(null)
      });

      it('should not fire profiles changes', () => {
        expect(profilesSetValueSpy).toBeCalledWith(newValue.profiles, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profilesOnChangeSpy).toBeCalledWith();
        expect(profilesOnChangeSpy).toBeCalledTimes(2);
        expect(userProfiles).toEqual(null)
      });

      it('should not fire profile 0 changes', () => {
        expect(profile0SetValueSpy).toBeCalledWith(newValue.profiles[0], {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profile0OnChangeSpy).toBeCalledWith();
        expect(profile0OnChangeSpy).toBeCalledTimes(1);
        expect(userProfile0).toEqual(null)
      });

      it('should not fire profile 0 username changes', () => {
        expect(profile0UsernameSetValueSpy).toBeCalledWith(newValue.profiles[0].username, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(profile0UsernameOnChangeSpy).toBeCalledWith();
        expect(profile0UsernameOnChangeSpy).toBeCalledTimes(1);
        expect(userProfile0Username).toEqual(null)
      });

      it('should not fire rights changes', () => {
        expect(rightsSetValueSpy).toBeCalledWith(newValue.rights, { "emitEvent": false, "notifyParent": false });
        expect(rightsOnChangeSpy).toBeCalledWith();
        expect(rightsOnChangeSpy).toBeCalledTimes(1);
        expect(userRights).toEqual(null)
      });

      it('should not fire rights view users changes', () => {
        expect(rightsViewUsersSetValueSpy).toBeCalledWith(newValue.rights.viewUsers, {
          "emitEvent": false,
          "notifyParent": false
        });
        expect(rightsViewUsersOnChangeSpy).toBeCalledWith();
        expect(rightsViewUsersOnChangeSpy).toBeCalledTimes(1);
        expect(userRightsViewUsers).toEqual(null)
      });
    });

    describe('should not fire on child change', () => {
      beforeEach(reset);

      it('should not fire on name change', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('name').setValue(newValue.name, { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          name: newValue.name
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          name: newValue.name
        })
      })

      it('should not fire on group update', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('groups').setValue([
          newValue.groups[0],
        ], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          groups: [
            newValue.groups[0],
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          groups: [
            newValue.groups[0],
          ]
        })
      })

      it('should not fire on group update direct', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('groups').at(0).setValue(newValue.groups[0], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          groups: [
            newValue.groups[0],
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          groups: [
            newValue.groups[0],
          ]
        })
      })

      it('should not fire on group add', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('groups').setValue([
          initialValue.groups[0],
          newValue.groups[0],
        ], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          groups: [
            initialValue.groups[0],
            newValue.groups[0],
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          groups: [
            initialValue.groups[0],
            newValue.groups[0],
          ]
        })
      })

      it('should not fire on profile badge update', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('profiles').at(0).get('badges')
          .setValue([
            newValue.profiles[0].badges[0]
          ], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
      })

      it('should not fire on profile badge update direct', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('profiles').at(0).get('badges')
          .at(0).setValue(newValue.profiles[0].badges[0], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
      })

      it('should not fire on profile badge add', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('profiles').at(0).get('badges')
          .setValue([
            initialValue.profiles[0].badges[0],
            newValue.profiles[0].badges[0]
          ], { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                initialValue.profiles[0].badges[0],
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          profiles: [
            {
              ...initialValue.profiles[0],
              badges: [
                initialValue.profiles[0].badges[0],
                newValue.profiles[0].badges[0]
              ]
            }
          ]
        })
      })

      it('should not fire on rights change', () => {
        expect(supervisor.value).toEqual(initialValue)

        supervisor.get('rights').get('viewUsers').setValue(newValue.rights.viewUsers, { emitEvent: false });

        expect(onChangeSpy).toBeCalledTimes(1);
        expect(onChangeSpy).toBeCalledWith();
        expect(supervisor.value).toEqual({
          ...initialValue,
          rights: newValue.rights
        })
        expect(supervisor['compareEngine'].rightValue).toEqual({
          ...initialValue,
          rights: newValue.rights
        })
      })
    });
  })
});
