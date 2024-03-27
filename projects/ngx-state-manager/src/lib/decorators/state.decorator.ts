import "reflect-metadata";
import { StateConfiguration } from "../models/state-configuration.interface";
import { ValueRecord } from "@alkemist/smart-tools";
import { Type } from "@angular/core";
import { StatesMap } from '../indexes/states-map';

export function State<C extends Object, S extends ValueRecord>(configuration: StateConfiguration<C, S>) {
  return <ClassDecorator>function (target: Type<C>) {
    StatesMap.registerState<C, S>(configuration.class.name, configuration);

    return Reflect.getMetadata(Symbol("State"), target);
  };
}
