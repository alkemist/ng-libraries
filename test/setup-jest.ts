import 'jest-extended';
import 'jest-preset-angular/setup-jest';
import { localStorageMock } from "./setup-storage";

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
