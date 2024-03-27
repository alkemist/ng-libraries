import { CONSOLE_LOG_STYLES, ConsoleHelper, ValueKey, ValueRecord } from '@alkemist/smart-tools';
import { StateConfiguration } from '../models/state-configuration.interface';
import { StateSelectFunction } from '../models/state-select-function.type';
import { StateActionFunction } from '../models/state-action-function.type';
import { WritableSignal } from '@angular/core';
import { SelectsIndex } from "./selects-index";
import { UnknownAction } from '../models/unknown-action.error';
import { StateActionIndex } from '../models/state-action-index.interface';
import { StateActionDefinition } from '../models/state-action-definition.interface';
import { StateActionClass } from '../models/state-action-class.interface';

export abstract class StatesMap {
  private static showIndexLog = false;
  private static selectsByState = new Map<string, SelectsIndex>();
  private static actionIndex = new Map<string, StateActionIndex>();

  static registerSelect<C extends Object, S extends ValueRecord, T>(
    stateKey: string,
    selectKey: string,
    selectFunction: StateSelectFunction<S, T>,
    path?: ValueKey | ValueKey[]
  ) {
    if (StatesMap.showIndexLog) {
      ConsoleHelper.group(
        `[State Init][${ stateKey }] Registre select`,
        [ { title: 'Key : ' + selectKey }, { title: 'Function', data: selectFunction }, { title: 'Path', data: path } ],
        [ CONSOLE_LOG_STYLES.red ]
      )
    }

    let map = StatesMap.getOrCreate<C, S>(stateKey);

    map.setSelect(selectKey, selectFunction, path);
    StatesMap.selectsByState.set(stateKey, map);
  }

  static registerAction<A extends Object, S extends ValueRecord, T>(
    stateKey: string,
    action: StateActionDefinition<A, T>,
    actionFunction: StateActionFunction<S, T>,
  ) {
    if (StatesMap.showIndexLog) {
      ConsoleHelper.group(
        `[State Init][${ stateKey }] Registre action`,
        [
          { title: 'Log : ' + action.log },
          { title: 'Action', data: action },
          { title: 'Function', data: actionFunction }
        ],
        [ CONSOLE_LOG_STYLES.red ]
      )
    }

    this.actionIndex.set(
      action.name,
      {
        stateKey,
        actionFunction,
        actionLog: action.log
      }
    )
  }

  static registerObserver<C extends Object, S extends ValueRecord, T>(
    stateKey: string,
    selectKey: string,
    observerKey: string,
    observer: WritableSignal<T>
  ) {
    if (StatesMap.showIndexLog) {
      ConsoleHelper.group(
        `[State Init][${ stateKey }] Registre observer`,
        [ { title: 'Select key : ' + selectKey }, { title: 'Observer key : ' + observerKey }, {
          title: 'Observer',
          data: observer
        } ],
        [ CONSOLE_LOG_STYLES.red ]
      )
    }

    let map = StatesMap.getOrCreate<C, S>(stateKey);

    map.setObserver(selectKey, observerKey, observer);
    StatesMap.selectsByState.set(stateKey, map);
  }

  static registerState<C extends Object, S extends ValueRecord>(
    stateKey: string,
    configuration: StateConfiguration<C, S>
  ) {
    if (StatesMap.showIndexLog) {
      ConsoleHelper.group(
        `[State Init][${ stateKey }] Registre state`,
        [
          { title: 'Configuration', data: configuration },
        ],
        [ CONSOLE_LOG_STYLES.red ]
      )
    }
    let map = StatesMap.getOrCreate<C, S>(stateKey);

    map.initContext(configuration);
  }

  static getSelectsIndex<C extends Object, S extends ValueRecord>(stateKey: string) {
    return <SelectsIndex<C, S>>StatesMap.selectsByState.get(stateKey)
  }

  static dispatch(actions: StateActionClass[]) {
    const stateKeysToUpdate: string[] = [];

    actions.forEach(action => {
      const actionKey = action.constructor.name;
      const stateAction = StatesMap.actionIndex.get(actionKey);

      if (!stateAction) {
        throw new UnknownAction(actionKey)
      }

      StatesMap.getSelectsIndex(stateAction.stateKey)
        .apply(stateAction.actionFunction, action.payload, stateAction.actionLog);

      if (stateKeysToUpdate.indexOf(stateAction.stateKey) === -1) {
        stateKeysToUpdate.push(stateAction.stateKey)
      }
    })

    stateKeysToUpdate.forEach(stateKey =>
      StatesMap.getSelectsIndex(stateKey)
        .update()
    );
  }

  private static hasState(stateKey: string) {
    return StatesMap.selectsByState.has(stateKey);
  }

  private static getOrCreate<C extends Object, S extends ValueRecord>(stateKey: string) {
    return StatesMap.hasState(stateKey)
      ? StatesMap.getSelectsIndex<C, S>(stateKey)
      : new SelectsIndex<C, S>();
  }
}

